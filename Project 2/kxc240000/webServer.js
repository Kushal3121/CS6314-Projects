/**
 * Simple Express server for Project 1
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import models from './modelData/photoApp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    return res.sendStatus(200);
  }
  return next();
});

// Serve static files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  return res.send(`Simple web server of files from ${__dirname}`);
});

/**
 * /test/info
 */
app.get('/test/info', (req, res) => {
  const info = models.schemaInfo2();
  return res.status(200).send(info);
});

/**
 * /user/list
 */
app.get('/user/list', (req, res) => {
  return res.status(200).send(models.userListModel());
});

/**
 * /user/:id
 */
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  const user = models.userModel(userId);

  if (!user) {
    console.error(`User not found: ${userId}`);
    return res.status(404).send({ message: 'User not found' });
  }
  return res.status(200).send(user);
});

/**
 * /photosOfUser/:id
 */
app.get('/photosOfUser/:id', (req, res) => {
  const userId = req.params.id;
  const photos = models.photoOfUserModel(userId);

  if (!photos || photos.length === 0) {
    console.error(`No photos for user: ${userId}`);
    return res.status(404).send({ message: 'No photos for this user' });
  }
  return res.status(200).send(photos);
});

const server = app.listen(portno, () => {
  const { port } = server.address();
  console.log(`Listening at http://localhost:${port} exporting ${__dirname}`);
});
