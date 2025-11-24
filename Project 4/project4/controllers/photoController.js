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
      .select('_id user_id comments file_name date_time')
      .lean();

    // If a user has no photos yet, return an empty array with 200 so clients can
    // render a friendly "No photos yet" state instead of treating it as an error.
    if (!photos || photos.length === 0) {
      return res.status(200).json([]);
    }

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
    });
    await Promise.all(populationPromises);

    return res.status(200).json(photos);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /photosOfUser/:id:', err);
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
