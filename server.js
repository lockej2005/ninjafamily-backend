const express = require('express');
const cors = require('cors');
const app = express();
const apiRouter = require('./api');

app.use(express.json());

const allowedOrigins = ['http://localhost:3000', 'https://promisestat.azurewebsites.net'];

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

app.use('/api', apiRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});

