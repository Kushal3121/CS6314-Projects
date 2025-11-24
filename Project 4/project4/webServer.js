/**
 * Project 2 Express server connected to MongoDB 'project2'.
 * Start with: node webServer.js
 * Client uses axios to call these endpoints.
 */

import mongoose from 'mongoose';
import bluebird from 'bluebird';
import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { login, logout } from './controllers/authController.js';
import {
  register as registerUser,
  listUsers,
  getUserById,
  getCounts,
  getUsageHighlights,
  deleteUser as deleteUserHandler,
  getFavorites as getFavoritesHandler,
  addFavorite as addFavoriteHandler,
  removeFavorite as removeFavoriteHandler,
} from './controllers/userController.js';
import {
  uploadMiddleware as uploadPhotoMiddleware,
  uploadPhoto as uploadPhotoHandler,
  getPhotosOfUser as getPhotosOfUserHandler,
  deletePhoto as deletePhotoHandler,
  likePhoto as likePhotoHandler,
  unlikePhoto as unlikePhotoHandler,
  addTagToPhoto as addTagToPhotoHandler,
} from './controllers/photoController.js';
import {
  addCommentToPhoto as addCommentToPhotoHandler,
  getCommentsOfUser as getCommentsOfUserHandler,
  getMentionsOfUser as getMentionsOfUserHandler,
  deleteComment as deleteCommentHandler,
} from './controllers/commentController.js';

import User from './schema/user.js';
import Photo from './schema/photo.js';
import SchemaInfo from './schema/schemaInfo.js';
import { getRecentActivities, getLastActivityByUser } from './controllers/activityController.js';

const portno = 3001;
const app = express();

// Parse JSON bodies
app.use(express.json());

// Enable CORS with credentials for Vite dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return next();
});

// Session middleware
app.use(
  session({
    secret: 'photoapp-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

mongoose.Promise = bluebird;
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1/project3', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Normalize visibility: convert legacy/accidental owner-only flags on seeded/public photos
// back to public by unsetting empty sharing lists. Safe to run on each server start.
mongoose.connection.once('open', async () => {
  try {
    const result = await Photo.updateMany(
      { shared_with: { $exists: true, $size: 0 } },
      { $unset: { shared_with: '' } }
    );
    // eslint-disable-next-line no-console
    console.log(
      `Visibility normalization complete. Matched: ${
        result.matchedCount ?? result.n
      }, modified: ${result.modifiedCount ?? result.nModified}`
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Visibility normalization failed:', e);
  }
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

/* ---------- AUTH ROUTES ---------- */
app.post('/admin/login', login);
app.post('/admin/logout', logout);

/* ---------- AUTH GUARD FOR MAIN API ROUTES ---------- */
// Allow unauthenticated access to test routes and auth endpoints only
app.use((req, res, next) => {
  if (
    req.path.startsWith('/test/') ||
    req.path.startsWith('/admin/') ||
    (req.method === 'POST' && req.path === '/user')
  ) {
    return next();
  }
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
});

/* ---------- MAIN ROUTES ---------- */

// Registration
app.post('/user', registerUser);

// Upload new photo for current user
app.post('/photos/new', uploadPhotoMiddleware, uploadPhotoHandler);

// Get list of all users
app.get('/user/list', listUsers);

// Add a new comment to a photo
app.post('/commentsOfPhoto/:photo_id', addCommentToPhotoHandler);
// Delete a comment (author-only)
app.delete('/commentsOfPhoto/:photo_id/:comment_id', deleteCommentHandler);

// Return photo + comment counts per user
app.get('/user/counts', getCounts);

// Get user details by ID
app.get('/user/:id', getUserById);
// Delete own user account
app.delete('/user/:id', deleteUserHandler);

// Get user highlights (most recent / most commented photo)
app.get('/user/:id/highlights', getUsageHighlights);

// Get photos of a specific user
app.get('/photosOfUser/:id', getPhotosOfUserHandler);
// Delete a photo (owner-only)
app.delete('/photos/:photo_id', deletePhotoHandler);
// Like/unlike a photo
app.post('/photos/:photo_id/like', likePhotoHandler);
app.post('/photos/:photo_id/unlike', unlikePhotoHandler);
// Add a tag to a photo
app.post('/photos/:photo_id/tags', addTagToPhotoHandler);

// Return all comments authored by a user (with thumbnails)
app.get('/commentsOfUser/:id', getCommentsOfUserHandler);

// Return all photos where the user is @mentioned
app.get('/mentionsOfUser/:id', getMentionsOfUserHandler);

// Activities feed (recent N, default 5)
app.get('/activities', getRecentActivities);
// Last activity per user
app.get('/activities/last-by-user', getLastActivityByUser);

// Favorites (current user)
app.get('/favorites', getFavoritesHandler);
app.post('/favorites/:photo_id', addFavoriteHandler);
app.delete('/favorites/:photo_id', removeFavoriteHandler);

/* ---------- START SERVER ---------- */
const server = app.listen(portno, () => {
  const port = server.address().port;
  console.log(
    `Listening at http://localhost:${port} exporting the directory ${__dirname}`
  );
});
