/**
 * Project 2 Express server connected to MongoDB 'project2'.
 * Start with: node webServer.js
 * Client uses axios to call these endpoints.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import mongoose from "mongoose";
// eslint-disable-next-line import/no-extraneous-dependencies
import bluebird from "bluebird";
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ToDO - Your submission should work without this line. Comment out or delete this line for tests and before submission!
import models from "./modelData/photoApp.js";

// Load the Mongoose schema for User, Photo, and SchemaInfo
// ToDO - Your submission will use code below, so make sure to uncomment this line for tests and before submission!
// import User from "./schema/user.js";
// import Photo from "./schema/photo.js";
// import SchemaInfo from "./schema/schemaInfo.js";

const portno = 3001; // Port number to use
const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

mongoose.Promise = bluebird;
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project2", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * /test/info - Returns the SchemaInfo object of the database in JSON format.
 *              This is good for testing connectivity with MongoDB.
 */

app.get('/test/info', (request, response) => {
  const info = models.schemaInfo();
  response.status(200).send(info);
});

/**
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get('/test/counts', (request, response) => {
  const users = models.userListModel();
  let photoCount = 0;
  users.forEach((user) => {
    photoCount += models.photoOfUserModel(user._id).length;
  });
  response.status(200).send({
    user: users.length,
    photo: photoCount,
    schemaInfo: 1
  });
});

/**
 * URL /user/list - Returns all the User objects.
 */
app.get('/user/list', (request, response) => {
  response.status(200).send(models.userListModel());
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get('/user/:id', (request, response) => {
  const user = models.userModel(request.params.id);
  if (!user) {
    response.status(400).send("Not found");
    return;
  }
  response.status(200).send(user);
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get('/photosOfUser/:id', (request, response) => {
  const photos = models.photoOfUserModel(request.params.id);
  if (!photos || photos.length === 0) {
    return response.status(404).send({ error: 'Photos not found' });
  }
  return response.status(200).send(photos);
});

const server = app.listen(portno, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
