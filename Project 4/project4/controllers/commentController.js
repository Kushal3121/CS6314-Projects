import mongoose from 'mongoose';
import Photo from '../schema/photo.js';
import User from '../schema/user.js';

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
    // Extract react-mentions markup: @[display](id)
    const mentionMatches = [...trimmed.matchAll(/\@\[([^\]]+)\]\(([^\)]+)\)/g)];
    const mentionedIds = mentionMatches
      .map((m) => m[2])
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    let validMentionIds = [];
    if (mentionedIds.length) {
      const validUsers = await User.find(
        { _id: { $in: mentionedIds } },
        '_id'
      ).lean();
      validMentionIds = validUsers.map((u) => u._id);
    }
    // Store clean text that displays as "@Name"
    const displayText = trimmed.replace(
      /\@\[([^\]]+)\]\(([^\)]+)\)/g,
      '@$1'
    );
    photo.comments.push({
      comment: displayText,
      date_time: new Date(),
      user_id: userId,
      mentions: validMentionIds,
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

export async function getMentionsOfUser(req, res) {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    // Find photos where any comment mentions this user
    const photos = await Photo.find({
      'comments.mentions': { $in: [id, new mongoose.Types.ObjectId(id)] },
    })
      .select('_id user_id file_name')
      .lean();

    if (!photos.length) {
      return res.status(200).json([]);
    }

    // Fetch owners for labeling
    const ownerIds = [
      ...new Set(
        photos.map((p) => p.user_id?.toString?.() || p.user_id)
      ),
    ];
    const owners = await User.find(
      { _id: { $in: ownerIds } },
      '_id first_name last_name'
    ).lean();
    const ownerMap = new Map(
      owners.map((o) => [o._id.toString(), o])
    );

    const result = photos.map((p) => {
      const ownerKey = p.user_id?.toString?.() || p.user_id;
      const owner = ownerMap.get(ownerKey) || null;
      return {
        photo_id: p._id,
        file_name: p.file_name,
        owner_id: ownerKey,
        owner_first_name: owner?.first_name || '',
        owner_last_name: owner?.last_name || '',
      };
    });
    return res.status(200).json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /mentionsOfUser/:id', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

