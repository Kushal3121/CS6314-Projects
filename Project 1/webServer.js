/**

 * A simple Node.js program for exporting the current working directory via a
 * webserver listing on a hard code (see portno below) port. To start the
 * webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:3001 will be able to fetch any
 * file accessible to the current user in the current directory or any of its
 * children.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import models from './modelData/photoApp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get('/', (request, response) => {
  response.send(`Simple web server of files from ${__dirname}`);
});

app.get('/test/info', (request, response) => {
  const info = models.schemaInfo2();
  response.status(200).send(info);
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
app.get('/user/:id', () => {
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get('/photosOfUser/:id', () => {
});

const server = app.listen(portno, () => {
  const { port } = server.address();
  // eslint-disable-next-line no-console
  console.log(
    `Listening at http://localhost:${
      port
    } exporting the directory ${
      __dirname}`,
  );
});
