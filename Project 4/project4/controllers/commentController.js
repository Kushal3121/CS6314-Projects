import mongoose from 'mongoose';
import Photo from '../schema/photo.js';

export async function addCommentToPhoto(req, res) {
  const { photo_id } = req.params;
  const { comment } = req.body || {};
  try {
    const trimmed = (comment || '').trim();
    if (!trimmed) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
      return res.status(400).json({ message: 'Invalid photo id' });
    }
    const photo = await Photo.findById(photo_id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    const userId = req.session?.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    photo.comments.push({
      comment: trimmed,
      date_time: new Date(),
      user_id: userId,
    });
    await photo.save();
    return res.status(200).json({ message: 'Comment added' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /commentsOfPhoto/:photo_id', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getCommentsOfUser(req, res) {
  const { id } = req.params;
  try {
    const photos = await Photo.find({
      'comments.user_id': { $in: [id, new mongoose.Types.ObjectId(id)] },
    })
      .select('_id user_id file_name comments')
      .lean();

    const result = [];
    for (const photo of photos) {
      for (const c of photo.comments || []) {
        if ((c.user_id?.toString?.() || c.user_id) === id) {
          result.push({
            photo_id: photo._id,
            owner_id: photo.user_id?.toString?.() || photo.user_id,
            file_name: photo.file_name,
            comment: c.comment,
            date_time: c.date_time,
          });
        }
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /commentsOfUser/:id', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

