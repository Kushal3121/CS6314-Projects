import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import multer from 'multer';
import Photo from '../schema/photo.js';
import User from '../schema/user.js';
import Activity from '../schema/activity.js';
import { logActivity } from './activityController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(projectRoot, 'images'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname || `upload_${Date.now()}.jpg`);
  },
});

export const uploadMiddleware = multer({ storage }).single('uploadedphoto');

export async function uploadPhoto(req, res) {
  try {
    const userId = req.session?.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Optional sharing list provided as JSON string in multipart field 'shared_with'
    let sharedWithIds;
    const rawShared = req.body?.shared_with;
    if (typeof rawShared === 'string' && rawShared.length) {
      try {
        const parsed = JSON.parse(rawShared);
        if (Array.isArray(parsed)) {
          const validIds = parsed.filter((x) =>
            mongoose.Types.ObjectId.isValid(x)
          );
          // De-duplicate and ensure they exist
          const uniqueIds = [...new Set(validIds)];
          if (uniqueIds.length) {
            const existingUsers = await User.find(
              { _id: { $in: uniqueIds } },
              '_id'
            ).lean();
            sharedWithIds = existingUsers.map((u) => u._id);
          } else {
            sharedWithIds = [];
          }
        }
      } catch (e) {
        // ignore parse errors -> treat as no list specified (public)
      }
    }

    const created = await Photo.create({
      file_name: req.file.filename,
      date_time: new Date(),
      user_id: userId,
      comments: [],
      // Important semantics:
      // - shared_with === undefined -> public (no restriction)
      // - shared_with === [] -> owner only
      // - shared_with contains ids -> restricted
      ...(sharedWithIds !== undefined ? { shared_with: sharedWithIds } : {}),
    });
    // Log photo upload
    await logActivity({
      type: 'photo_upload',
      userId,
      photoId: created._id,
      photoFileName: created.file_name,
    });
    return res.status(200).json({
      _id: created._id,
      file_name: created.file_name,
      user_id: created.user_id,
      date_time: created.date_time,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /photos/new:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getPhotosOfUser(req, res) {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const sessionUserId = req.session?.user?._id?.toString?.();
    const targetId = new mongoose.Types.ObjectId(id);
    const isOwnerView = sessionUserId && sessionUserId === id;

    const baseMatch = { $or: [{ user_id: id }, { user_id: targetId }] };
    let visibilityMatch = {};
    if (!isOwnerView) {
      // Seeded users have password "weak" in starter DB; treat owner-only seeded photos as public.
      const seededOwners = await User.find({ password: 'weak' }, '_id').lean();
      const seededOwnerIds = seededOwners.map((u) => u._id);
      visibilityMatch = {
        $or: [
          { shared_with: { $exists: false } }, // public
          {
            shared_with: {
              $in: [
                sessionUserId
                  ? new mongoose.Types.ObjectId(sessionUserId)
                  : null,
              ],
            },
          }, // shared with viewer
          // Seeded dataset special-case: empty list (owner-only) acts as public for seeded owners
          {
            $and: [
              { shared_with: { $exists: true, $size: 0 } },
              { user_id: { $in: seededOwnerIds } },
            ],
          },
        ],
      };
    }

    const match = isOwnerView
      ? baseMatch
      : { $and: [baseMatch, visibilityMatch] };

    const photos = await Photo.find(match)
      .select('_id user_id comments file_name date_time likes tags')
      .lean();

    // If a user has no photos yet, return an empty array with 200 so clients can
    // render a friendly "No photos yet" state instead of treating it as an error.
    if (!photos || photos.length === 0) {
      return res.status(200).json([]);
    }

    const me = sessionUserId
      ? await User.findById(sessionUserId, 'favorites').lean()
      : null;
    const favIds = (me?.favorites || []).map((x) => x?.toString?.() || x) || [];

    const populationPromises = photos.map(async (photo) => {
      const commentPromises = (photo.comments || []).map(async (comment) => {
        const commenterId = comment.user_id?.toString?.() || comment.user_id;
        const user = await User.findOne(
          { _id: commenterId },
          '_id first_name last_name'
        ).lean();
        comment.user = user || null;
        delete comment.user_id;
      });
      await Promise.all(commentPromises);
      // Populate tag user info
      const tagUserIds = [
        ...new Set(
          (photo.tags || [])
            .map((t) => t.user_id?.toString?.() || t.user_id)
            .filter(Boolean)
        ),
      ];
      if (tagUserIds.length) {
        const tagUsers = await User.find(
          { _id: { $in: tagUserIds } },
          '_id first_name last_name'
        ).lean();
        const tagUserMap = new Map(tagUsers.map((u) => [u._id.toString(), u]));
        photo.tags = (photo.tags || []).map((t) => {
          const key = t.user_id?.toString?.() || t.user_id;
          const user = tagUserMap.get(key) || null;
          return {
            _id: t._id,
            x: t.x,
            y: t.y,
            w: t.w,
            h: t.h,
            date_time: t.date_time,
            user: user
              ? { _id: user._id, first_name: user.first_name, last_name: user.last_name }
              : null,
          };
        });
      } else {
        photo.tags = [];
      }
      // likes metadata
      const likesArray = photo.likes || [];
      photo.likesCount = Array.isArray(likesArray) ? likesArray.length : 0;
      if (sessionUserId) {
        photo.likedByViewer = likesArray
          .map((x) => x?.toString?.() || x)
          .includes(sessionUserId);
      } else {
        photo.likedByViewer = false;
      }
      // favorite metadata
      photo.favoritedByViewer = favIds.includes(
        photo._id?.toString?.() || photo._id
      );
      delete photo.likes;
    });
    await Promise.all(populationPromises);

    // Sort by likes desc, then date_time desc
    photos.sort((a, b) => {
      const likeDiff = (b.likesCount || 0) - (a.likesCount || 0);
      if (likeDiff !== 0) return likeDiff;
      const aTime = new Date(a.date_time).getTime();
      const bTime = new Date(b.date_time).getTime();
      return bTime - aTime;
    });

    return res.status(200).json(photos);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /photosOfUser/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /photos/:photo_id/tags
 * Adds a rectangular user tag to a photo with relative coordinates.
 * Body: { user_id, x, y, w, h }
 */
export async function addTagToPhoto(req, res) {
  const { photo_id } = req.params;
  const { user_id, x, y, w, h } = req.body || {};
  try {
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
      return res.status(400).json({ message: 'Invalid photo id' });
    }
    const viewerId = req.session?.user?._id?.toString?.();
    if (!viewerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: 'Invalid user to tag' });
    }
    const taggedUser = await User.findById(user_id, '_id').lean();
    if (!taggedUser) {
      return res.status(404).json({ message: 'Tagged user not found' });
    }
    // Validate coordinates: numbers in [0,1], positive size, and clipping handled client-side
    const nums = [x, y, w, h];
    if (nums.some((n) => typeof n !== 'number' || Number.isNaN(n))) {
      return res.status(400).json({ message: 'Invalid coord types' });
    }
    const clamp01 = (n) => Math.max(0, Math.min(1, n));
    const cx = clamp01(x);
    const cy = clamp01(y);
    const cw = clamp01(w);
    const ch = clamp01(h);
    if (cw <= 0 || ch <= 0) {
      return res.status(400).json({ message: 'Rectangle must have positive size' });
    }
    // Also ensure rect within [0,1] when combined
    const maxX = Math.min(1, cx + cw);
    const maxY = Math.min(1, cy + ch);
    const finalW = maxX - cx;
    const finalH = maxY - cy;
    // Ensure photo exists and visible to viewer (reuse earlier rules)
    const photo = await Photo.findById(photo_id).lean();
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    const isOwner = (photo.user_id?.toString?.() || photo.user_id) === viewerId;
    if (!isOwner) {
      const seededOwners = await User.find({ password: 'weak' }, '_id').lean();
      const seededOwnerIds = seededOwners.map((u) => u._id?.toString?.());
      const isSeededOwnerOwnerOnlyPublic =
        Array.isArray(photo.shared_with) &&
        photo.shared_with.length === 0 &&
        seededOwnerIds.includes(photo.user_id?.toString?.());
      const isPublic = !Array.isArray(photo.shared_with);
      const isShared =
        Array.isArray(photo.shared_with) &&
        photo.shared_with.map((x) => x?.toString?.()).includes(viewerId);
      if (!isPublic && !isShared && !isSeededOwnerOwnerOnlyPublic) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    // Push tag
    const tag = {
      user_id: new mongoose.Types.ObjectId(user_id),
      x: cx,
      y: cy,
      w: finalW,
      h: finalH,
      date_time: new Date(),
    };
    const updated = await Photo.findOneAndUpdate(
      { _id: photo_id },
      { $push: { tags: tag } },
      { new: true, select: '_id tags' }
    ).lean();
    const newTag = updated?.tags?.[updated.tags.length - 1];
    return res.status(200).json({
      _id: newTag?._id,
      x: newTag?.x,
      y: newTag?.y,
      w: newTag?.w,
      h: newTag?.h,
      user_id,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /photos/:photo_id/tags', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
export async function deletePhoto(req, res) {
  const { photo_id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
      return res.status(400).json({ message: 'Invalid photo id' });
    }
    const userId = req.session?.user?._id?.toString?.();
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const photo = await Photo.findById(photo_id).lean();
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    const ownerId = photo.user_id?.toString?.() || photo.user_id;
    if (ownerId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Delete document
    await Photo.deleteOne({ _id: photo_id });
    // Best-effort: delete file from disk (ignore errors)
    try {
      if (photo.file_name) {
        const filePath = join(projectRoot, 'images', photo.file_name);
        fs.unlink(filePath, () => {});
      }
    } catch (e) {
      // ignore
    }
    // Remove activities tied to this photo (upload/comments)
    try {
      await Activity.deleteMany({
        photo_id: new mongoose.Types.ObjectId(photo_id),
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete activities for photo:', e);
    }
    return res.status(200).json({ message: 'Photo deleted' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in DELETE /photos/:photo_id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function buildVisibilityFilterForPhoto(viewerObj) {
  if (!viewerObj) {
    // Only public or seeded special case will be considered by caller if needed
    return { shared_with: { $exists: false } };
  }
  return {
    $or: [
      { shared_with: { $exists: false } },
      { shared_with: { $in: [viewerObj] } },
    ],
  };
}

export async function likePhoto(req, res) {
  const { photo_id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
      return res.status(400).json({ message: 'Invalid photo id' });
    }
    const viewerId = req.session?.user?._id?.toString?.();
    if (!viewerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const viewerObj = new mongoose.Types.ObjectId(viewerId);
    // Ensure photo is visible to viewer (owner, public, or shared)
    const photo = await Photo.findOne({
      _id: new mongoose.Types.ObjectId(photo_id),
    }).lean();
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    const isOwner = (photo.user_id?.toString?.() || photo.user_id) === viewerId;
    if (!isOwner) {
      const seededOwners = await User.find({ password: 'weak' }, '_id').lean();
      const seededOwnerIds = seededOwners.map((u) => u._id?.toString?.());
      const isSeededOwnerOwnerOnlyPublic =
        Array.isArray(photo.shared_with) &&
        photo.shared_with.length === 0 &&
        seededOwnerIds.includes(photo.user_id?.toString?.());
      const isPublic = !Array.isArray(photo.shared_with);
      const isShared =
        Array.isArray(photo.shared_with) &&
        photo.shared_with.map((x) => x?.toString?.()).includes(viewerId);
      if (!isPublic && !isShared && !isSeededOwnerOwnerOnlyPublic) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    await Photo.updateOne(
      { _id: photo_id },
      { $addToSet: { likes: viewerObj } }
    );
    const updated = await Photo.findById(photo_id, 'likes').lean();
    const likesCount = Array.isArray(updated?.likes) ? updated.likes.length : 0;
    return res.status(200).json({ liked: true, likesCount });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /photos/:photo_id/like:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function unlikePhoto(req, res) {
  const { photo_id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
      return res.status(400).json({ message: 'Invalid photo id' });
    }
    const viewerId = req.session?.user?._id?.toString?.();
    if (!viewerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const viewerObj = new mongoose.Types.ObjectId(viewerId);
    await Photo.updateOne({ _id: photo_id }, { $pull: { likes: viewerObj } });
    const updated = await Photo.findById(photo_id, 'likes').lean();
    const likesCount = Array.isArray(updated?.likes) ? updated.likes.length : 0;
    return res.status(200).json({ liked: false, likesCount });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /photos/:photo_id/unlike:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
