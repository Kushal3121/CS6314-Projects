/**
 * Project 2 Express server connected to MongoDB 'project2'.
 * Start with: node webServer.js
 * Client uses axios to call these endpoints.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import mongoose from 'mongoose';
// eslint-disable-next-line import/no-extraneous-dependencies
import bluebird from 'bluebird';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ToDO - Your submission should work without this line. Comment out or delete this line for tests and before submission!
// import models from "./modelData/photoApp.js";

// Load the Mongoose schema for User, Photo, and SchemaInfo
// ToDO - Your submission will use code below, so make sure to uncomment this line for tests and before submission!
import User from './schema/user.js';
import Photo from './schema/photo.js';
import SchemaInfo from './schema/schemaInfo.js';

const portno = 3001; // Port number to use
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

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get('/', function (request, response) {
  response.send('Simple web server of files from ' + __dirname);
});

/**
 * /test/info - Returns the SchemaInfo object of the database in JSON format.
 *              This is good for testing connectivity with MongoDB.
 */

app.get('/test/info', async (req, res) => {
  try {
    const info = await SchemaInfo.findOne({}).lean();
    res.status(200).json(info || { message: 'No schema info found' });
  } catch (err) {
    console.error('Error in /test/info:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
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

/**
 * URL /user/list - Returns all the User objects.
 */
app.get('/user/list', async (req, res) => {
  try {
    // Only return sidebar-needed fields
    const users = await User.find({}, '_id first_name last_name').lean();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error in /user/list:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get('/user/:id', async (req, res) => {
  const { id } = req.params;

  // Validate that the id is a proper MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    // Fetch only the fields needed by the frontend
    const user = await User.findById(
      id,
      '_id first_name last_name location description occupation'
    ).lean();

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('Error in /user/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get('/photosOfUser/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    // Find all photos belonging to the given user
    const photos = await Photo.find({ user_id: id })
      .select('_id user_id comments file_name date_time')
      .lean();

    if (!photos || photos.length === 0) {
      return res.status(404).json({ message: 'No photos found for this user' });
    }

    // For each comment, populate commenter info manually
    for (const photo of photos) {
      for (const comment of photo.comments) {
        const user = await User.findById(
          comment.user_id,
          '_id first_name last_name'
        ).lean();

        comment.user = user || null; // Attach minimal user info
        delete comment.user_id; // remove redundant user_id field
      }
    }

    return res.status(200).json(photos);
  } catch (err) {
    console.error('Error in /photosOfUser/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const server = app.listen(portno, () => {
  const port = server.address().port;
  console.log(
    `Listening at http://localhost:${port} exporting the directory ${__dirname}`
  );
});
