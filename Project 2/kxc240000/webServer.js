/**
 * Project 2 Express server connected to MongoDB 'project2'.
 * Start with: node webServer.js
 * Client uses axios to call these endpoints.
 */

import mongoose from 'mongoose';
import bluebird from 'bluebird';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import User from './schema/user.js';
import Photo from './schema/photo.js';
import SchemaInfo from './schema/schemaInfo.js';

const portno = 3001;
const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

mongoose.Promise = bluebird;
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1/project2', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.send('Simple web server of files from ' + __dirname);
});

/* ---------- TEST ROUTES ---------- */
app.get('/test/info', async (req, res) => {
  try {
    const info = await SchemaInfo.findOne({}).lean();
    res.status(200).json(info || { message: 'No schema info found' });
  } catch (err) {
    console.error('Error in /test/info:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/test/counts', async (req, res) => {
  try {
    const userCount = await User.countDocuments({});
    const photoCount = await Photo.countDocuments({});
    const schemaInfoCount = await SchemaInfo.countDocuments({});
    res.status(200).json({
      user: userCount,
      photo: photoCount,
      schemaInfo: schemaInfoCount,
    });
  } catch (err) {
    console.error('Error in /test/counts:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* ---------- MAIN ROUTES ---------- */

// Get list of all users
app.get('/user/list', async (req, res) => {
  try {
    const users = await User.find({}, '_id first_name last_name').lean();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error in /user/list:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Return photo + comment counts per user
app.get('/user/counts', async (req, res) => {
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

    res.status(200).json(counts);
  } catch (err) {
    console.error('Error in /user/counts:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user details by ID
app.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Validate ObjectId format
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
    res.status(200).json(user);
  } catch (err) {
    console.error('Error in /user/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get photos of a specific user
app.get('/photosOfUser/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const photos = await Photo.find({
      $or: [{ user_id: id }, { user_id: new mongoose.Types.ObjectId(id) }],
    })
      .select('_id user_id comments file_name date_time')
      .lean();

    if (!photos || photos.length === 0) {
      return res.status(404).json({ message: 'No photos found for this user' });
    }

    // Populate commenter info
    for (const photo of photos) {
      for (const comment of photo.comments || []) {
        const commenterId = comment.user_id?.toString?.() || comment.user_id;
        const user = await User.findOne(
          { _id: commenterId },
          '_id first_name last_name'
        ).lean();
        comment.user = user || null;
        delete comment.user_id;
      }
    }

    res.status(200).json(photos);
  } catch (err) {
    console.error('Error in /photosOfUser/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Return all comments authored by a user (with thumbnails)
app.get('/commentsOfUser/:id', async (req, res) => {
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

    res.status(200).json(result);
  } catch (err) {
    console.error('Error in /commentsOfUser/:id', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* ---------- START SERVER ---------- */
const server = app.listen(portno, () => {
  const port = server.address().port;
  console.log(
    `Listening at http://localhost:${port} exporting the directory ${__dirname}`
  );
});
