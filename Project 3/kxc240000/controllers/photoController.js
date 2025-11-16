import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import multer from 'multer';
import Photo from '../schema/photo.js';
import User from '../schema/user.js';

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
    const created = await Photo.create({
      file_name: req.file.filename,
      date_time: new Date(),
      user_id: userId,
      comments: [],
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
    const photos = await Photo.find({
      $or: [{ user_id: id }, { user_id: new mongoose.Types.ObjectId(id) }],
    })
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
