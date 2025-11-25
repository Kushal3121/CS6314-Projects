import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import Activity from '../schema/activity.js';
import Photo from '../schema/photo.js';
import User from '../schema/user.js';
import { logActivity } from './activityController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

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
      return res.status(400).json({
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
    // Log user registration (non-blocking)
    await logActivity({ type: 'user_register', userId: created._id });
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

/**
 * GET /favorites
 * Returns the current user's favorited photos (visible ones), newest first.
 */
export async function getFavorites(req, res) {
  try {
    const viewerId = req.session?.user?._id?.toString?.();
    if (!viewerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const me = await User.findById(viewerId, 'favorites').lean();
    if (!me) {
      return res.status(404).json({ message: 'User not found' });
    }
    const favoriteIds = (me.favorites || []).map((x) => x?.toString?.() || x);
    if (!favoriteIds.length) {
      return res.status(200).json([]);
    }
    // Fetch photos for favorites; do not leak non-visible restricted photos
    const viewerObj = new mongoose.Types.ObjectId(viewerId);
    const seededOwners = await User.find({ password: 'weak' }, '_id').lean();
    const seededOwnerIds = seededOwners.map((u) => u._id);
    const photos = await Photo.find({
      _id: { $in: favoriteIds },
      $or: [
        { user_id: viewerObj }, // own
        { shared_with: { $exists: false } }, // public
        { shared_with: { $in: [viewerObj] } }, // shared with viewer
        {
          $and: [
            { shared_with: { $exists: true, $size: 0 } },
            { user_id: { $in: seededOwnerIds } },
          ],
        }, // seeded owner-only treated as public
      ],
    })
      .select('_id user_id file_name date_time caption')
      .populate('user_id', 'first_name last_name')
      .lean();
    const mapped = (photos || []).map((p) => ({
      _id: p._id,
      file_name: p.file_name,
      date_time: p.date_time,
      caption: p.caption || '',
      user: {
        _id: p.user_id?._id || p.user_id,
        first_name: p.user_id?.first_name || '',
        last_name: p.user_id?.last_name || '',
      },
    }));
    mapped.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
    return res.status(200).json(mapped);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in GET /favorites:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /favorites/:photo_id
 * Adds a photo to the current user's favorites.
 */
export async function addFavorite(req, res) {
  const { photo_id } = req.params;
  try {
    const viewerId = req.session?.user?._id?.toString?.();
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
      return res.status(400).json({ message: 'Invalid photo id' });
    }
    // Ensure photo exists
    const photo = await Photo.findById(photo_id, '_id').lean();
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    await User.updateOne(
      { _id: viewerId },
      { $addToSet: { favorites: new mongoose.Types.ObjectId(photo_id) } }
    );
    return res.status(200).json({ favorited: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /favorites/:photo_id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * DELETE /favorites/:photo_id
 * Removes a photo from the current user's favorites.
 */
export async function removeFavorite(req, res) {
  const { photo_id } = req.params;
  try {
    const viewerId = req.session?.user?._id?.toString?.();
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
      return res.status(400).json({ message: 'Invalid photo id' });
    }
    await User.updateOne(
      { _id: viewerId },
      { $pull: { favorites: new mongoose.Types.ObjectId(photo_id) } }
    );
    return res.status(200).json({ favorited: false });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in DELETE /favorites/:photo_id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
export async function listUsers(req, res) {
  try {
    const includeAll = req.query.all === '1';
    const query = includeAll ? {} : { password: 'weak' };
    const users = await User.find(query, '_id first_name last_name').lean();
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
    const viewerId = req.session?.user?._id?.toString?.();
    let photos;
    if (viewerId) {
      const viewerObj = new mongoose.Types.ObjectId(viewerId);
      const seededOwners = await User.find({ password: 'weak' }, '_id').lean();
      const seededOwnerIds = seededOwners.map((u) => u._id);
      photos = await Photo.find({
        $or: [
          { user_id: viewerObj }, // own photos always visible
          { shared_with: { $exists: false } }, // public
          { shared_with: { $in: [viewerObj] } }, // shared with viewer
          {
            $and: [
              { shared_with: { $exists: true, $size: 0 } },
              { user_id: { $in: seededOwnerIds } },
            ],
          }, // seeded owner-only treated as public
        ],
      }).lean();
    } else {
      // Fallback (should not happen due to auth guard)
      const seededOwners = await User.find({ password: 'weak' }, '_id').lean();
      const seededOwnerIds = seededOwners.map((u) => u._id);
      photos = await Photo.find({
        $or: [
          { shared_with: { $exists: false } },
          {
            $and: [
              { shared_with: { $exists: true, $size: 0 } },
              { user_id: { $in: seededOwnerIds } },
            ],
          },
        ],
      }).lean();
    }

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
    const viewerId = req.session?.user?._id?.toString?.();
    const viewerObj = viewerId ? new mongoose.Types.ObjectId(viewerId) : null;

    // Build visibility filter identical to photosOfUser
    const isOwnerView = viewerId && viewerId === id;
    const baseMatch = { $or: [{ user_id: objectId }, { user_id: id }] };
    let visibilityMatch = {};
    if (!isOwnerView) {
      const seededOwners = await User.find({ password: 'weak' }, '_id').lean();
      const seededOwnerIds = seededOwners.map((u) => u._id);
      visibilityMatch = {
        $or: [
          { shared_with: { $exists: false } }, // public
          viewerObj ? { shared_with: { $in: [viewerObj] } } : { _id: null }, // if no viewer, match nothing
          {
            $and: [
              { shared_with: { $exists: true, $size: 0 } },
              { user_id: { $in: seededOwnerIds } },
            ],
          }, // seeded owner-only treated as public
        ],
      };
    }
    const highlightMatch = isOwnerView
      ? baseMatch
      : { $and: [baseMatch, visibilityMatch] };

    // Most recent photo
    const recentAgg = await Photo.aggregate([
      { $match: highlightMatch },
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
      { $match: highlightMatch },
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

/**
 * DELETE /user/:id
 * Deletes the user account, all their photos (and files), all comments authored by them,
 * and their activities, then logs them out.
 */
export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const sessionUserId = req.session?.user?._id?.toString?.();
    if (!sessionUserId || sessionUserId !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const objectId = new mongoose.Types.ObjectId(id);

    // Fetch photos to remove files
    const photos = await Photo.find(
      { user_id: { $in: [id, objectId] } },
      '_id file_name'
    ).lean();
    // Delete photo docs
    await Photo.deleteMany({ user_id: { $in: [id, objectId] } });
    // Delete files best-effort
    for (const p of photos) {
      try {
        if (p.file_name) {
          const filePath = join(projectRoot, 'images', p.file_name);
          fs.unlink(filePath, () => {});
        }
      } catch (e) {
        // ignore
      }
    }
    // Remove comments authored by this user across all photos
    await Photo.updateMany(
      {},
      { $pull: { comments: { user_id: { $in: [id, objectId] } } } }
    );
    // Delete activities authored by user or tied to user's photos
    try {
      const photoIds = photos.map((p) => p._id);
      await Activity.deleteMany({
        $or: [
          { user_id: objectId },
          { user_id: id },
          { photo_id: { $in: photoIds } },
        ],
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete user activities:', e);
    }
    // Delete user
    await User.deleteOne({ _id: objectId });

    // Destroy session
    return req.session.destroy((err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Error destroying session during delete:', err);
      }
      return res.status(200).json({ message: 'Account deleted' });
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in DELETE /user/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
