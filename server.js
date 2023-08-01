const express = require('express');
const cors = require('cors');
const app = express();
const apiRouter = require('./api');

// Middleware to parse incoming request bodies as JSON
app.use(express.json());

// Allowed origins
const allowedOrigins = ['http://localhost:3000', 'https://promisestat.azurewebsites.net'];

// Enable CORS for all routes and allow credentials
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT'],
}));

// Use the API router
app.use('/api', apiRouter);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
