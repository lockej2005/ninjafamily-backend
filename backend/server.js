const express = require('express');
const cors = require('cors');
const app = express();
const apiRouter = require('./api');

// Middleware to parse incoming request bodies as JSON
app.use(express.json());

// Enable CORS for all routes and allow credentials
app.use(cors({
  origin: 'http://localhost:3000',  // replace with your client app's URL
  credentials: true
}));

// Use the API router
app.use('/api', apiRouter);

// Start the server
const port = process.env.PORT || 6000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
