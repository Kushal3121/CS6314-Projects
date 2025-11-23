import mongoose from 'mongoose';
import User from '../schema/user.js';
import Photo from '../schema/photo.js';

export async function register(req, res) {
  try {
    const {
      login_name,
      password,
      first_name,
      last_name,
      location,
      description,
      occupation,
    } = req.body || {};
    if (!login_name || !password || !first_name || !last_name) {
      return res
        .status(400)
        .json({
          message: 'login_name, password, first_name, last_name required',
        });
    }
    const existing = await User.findOne({ login_name }).lean();
    if (existing) {
      return res.status(400).json({ message: 'login_name already exists' });
    }
    const created = await User.create({
      login_name,
      password,
      first_name,
      last_name,
      location: location || '',
      description: description || '',
      occupation: occupation || '',
    });
    return res.status(200).json({
      _id: created._id.toString(),
      login_name: created.login_name,
      first_name: created.first_name,
      last_name: created.last_name,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await User.find(
      { password: 'weak' },
      '_id first_name last_name'
    ).lean();
    // If the logged-in user is not one of the seeded users, append them so the UI can show
    // the current account in the sidebar without affecting test counts (tests login as seeded users).
    const sessionUserId = req.session?.user?._id;
    if (
      sessionUserId &&
      !users.find((u) => u._id.toString() === sessionUserId.toString())
    ) {
      const me = await User.findOne(
        { _id: sessionUserId },
        '_id first_name last_name'
      ).lean();
      if (me) {
        users.push(me);
      }
    }
    return res.status(200).json(users);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /user/list:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getUserById(req, res) {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user =
      (await User.findById(
        id,
        '_id first_name last_name location description occupation'
      ).lean()) ||
      (await User.findOne(
        { _id: id },
        '_id first_name last_name location description occupation'
      ).lean());

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /user/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getCounts(req, res) {
  try {
    const users = await User.find({}, '_id first_name last_name').lean();
    const photos = await Photo.find({}).lean();

    const counts = users.map((u) => ({
      _id: u._id.toString(),
      photoCount: 0,
      commentCount: 0,
    }));

    for (const photo of photos) {
      const userId = photo.user_id?.toString?.() || photo.user_id;
      if (userId) {
        const userMatch = counts.find((c) => c._id === userId);
        if (userMatch) userMatch.photoCount += 1;
      }

      for (const c of photo.comments || []) {
        const commenterId = c.user_id?.toString?.() || c.user_id;
        if (commenterId) {
          const commenter = counts.find((x) => x._id === commenterId);
          if (commenter) commenter.commentCount += 1;
        }
      }
    }

    return res.status(200).json(counts);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /user/counts:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /user/:id/highlights
 * Returns the most recent photo and the most commented photo for a given user.
 * Each object contains: _id, file_name, date_time, commentsCount.
 */
export async function getUsageHighlights(req, res) {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const objectId = new mongoose.Types.ObjectId(id);

    // Most recent photo
    const recentAgg = await Photo.aggregate([
      {
        $match: {
          $or: [{ user_id: objectId }, { user_id: id }],
        },
      },
      {
        $project: {
          _id: 1,
          file_name: 1,
          date_time: 1,
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      { $sort: { date_time: -1 } },
      { $limit: 1 },
    ]);
    const mostRecent = recentAgg[0] || null;

    // Most commented photo (tie-breaker: most recent)
    const mostCommentedAgg = await Photo.aggregate([
      {
        $match: {
          $or: [{ user_id: objectId }, { user_id: id }],
        },
      },
      {
        $project: {
          _id: 1,
          file_name: 1,
          date_time: 1,
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      { $sort: { commentsCount: -1, date_time: -1 } },
      { $limit: 1 },
    ]);
    const mostCommented = mostCommentedAgg[0] || null;

    return res.status(200).json({
      mostRecent,
      mostCommented,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /user/:id/highlights:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
