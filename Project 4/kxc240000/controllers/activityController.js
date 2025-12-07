import Activity from '../schema/activity.js';
import User from '../schema/user.js';

/**
 * Log a new activity.
 * Safe to call inside controllers; failures should not break the main flow.
 */
export async function logActivity({
  type,
  userId,
  photoId,
  photoFileName,
}) {
  if (!type || !userId) return;
  try {
    await Activity.create({
      type,
      date_time: new Date(),
      user_id: userId,
      ...(photoId ? { photo_id: photoId } : {}),
      ...(photoFileName ? { photo_file_name: photoFileName } : {}),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to log activity:', e);
  }
}

/**
 * GET /activities
 * Returns recent activities, newest first. Default limit=5.
 * Each entry includes user basic info and optional photo thumbnail filename.
 */
export async function getRecentActivities(req, res) {
  try {
    const limit = Math.max(
      1,
      Math.min(50, Number(req.query.limit) || 5)
    );
    const entries = await Activity.find({})
      .sort({ date_time: -1 })
      .limit(limit)
      .lean();

    if (!entries.length) {
      return res.status(200).json([]);
    }

    // Attach user names
    const userIds = [
      ...new Set(entries.map((a) => a.user_id?.toString?.() || a.user_id)),
    ];
    const users = await User.find(
      { _id: { $in: userIds } },
      '_id first_name last_name'
    ).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const result = entries.map((a) => {
      const key = a.user_id?.toString?.() || a.user_id;
      const user = userMap.get(key) || null;
      return {
        _id: a._id,
        type: a.type,
        date_time: a.date_time,
        user: user
          ? { _id: user._id, first_name: user.first_name, last_name: user.last_name }
          : null,
        photo_file_name: a.photo_file_name || null,
        photo_id: a.photo_id || null,
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in GET /activities:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /activities/last-by-user
 * Returns the most recent activity for each user.
 * Response: [{ user_id, type, date_time, photo_file_name, photo_id }]
 */
export async function getLastActivityByUser(req, res) {
  try {
    const agg = await Activity.aggregate([
      { $sort: { date_time: -1 } },
      {
        $group: {
          _id: '$user_id',
          type: { $first: '$type' },
          date_time: { $first: '$date_time' },
          photo_file_name: { $first: '$photo_file_name' },
          photo_id: { $first: '$photo_id' },
        },
      },
    ]);
    const mapped = (agg || []).map((a) => ({
      user_id: a._id?.toString?.() || a._id,
      type: a.type,
      date_time: a.date_time,
      photo_file_name: a.photo_file_name || null,
      photo_id: a.photo_id || null,
    }));
    return res.status(200).json(mapped);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in GET /activities/last-by-user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


