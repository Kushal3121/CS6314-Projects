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
} from './controllers/userController.js';
import {
  uploadMiddleware as uploadPhotoMiddleware,
  uploadPhoto as uploadPhotoHandler,
  getPhotosOfUser as getPhotosOfUserHandler,
} from './controllers/photoController.js';
import {
  addCommentToPhoto as addCommentToPhotoHandler,
  getCommentsOfUser as getCommentsOfUserHandler,
} from './controllers/commentController.js';

import User from './schema/user.js';
import Photo from './schema/photo.js';
import SchemaInfo from './schema/schemaInfo.js';

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

// Return photo + comment counts per user
app.get('/user/counts', getCounts);

// Get user details by ID
app.get('/user/:id', getUserById);

// Get user highlights (most recent / most commented photo)
app.get('/user/:id/highlights', getUsageHighlights);

// Get photos of a specific user
app.get('/photosOfUser/:id', getPhotosOfUserHandler);

// Return all comments authored by a user (with thumbnails)
app.get('/commentsOfUser/:id', getCommentsOfUserHandler);

/* ---------- START SERVER ---------- */
const server = app.listen(portno, () => {
  const port = server.address().port;
  console.log(
    `Listening at http://localhost:${port} exporting the directory ${__dirname}`
  );
});
