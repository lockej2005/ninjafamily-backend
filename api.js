const express = require('express');
const router = express.Router();
const db = require('./database');
const session = require('express-session');
const redis = require('redis');
let RedisStore = null;

// Redis client configuration
const client = redis.createClient({
  host: 'promisestat.redis.cache.windows.net',
  port: 6380,
  password: 'DTUTjdPPtjjFoVbrq0XLG2fqvgiCIpA8yAzCaED90XE',
  tls: {
      rejectUnauthorized: false
  }
});

client.on('error', (err) => {
    console.log('Redis error: ', err);
});

// Middleware to check if a user is authenticated
function checkAuthenticated(req, res, next) {
    if (req.session && req.session.username) {
        next();
    } else {
        // User is not authenticated, respond with 401 status
        res.status(401).json({ message: 'User not logged in.' });
    }
}

RedisStore = require('connect-redis')(session);

router.use(session({
    store: new RedisStore({ client: client }),
    secret: 'Your_Secret_Key',
    resave: false,
    saveUninitialized: false
}));


router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.getUser(username, password);
  if(user) {
    req.session.username = username;
    res.status(200).json({ message: 'User logged in successfully.' });
  } else {
    res.status(401).json({ message: 'Invalid username or password.' });
  }
});

router.get('/get-promises', checkAuthenticated, async (req, res) => {
  const senusername = req.session.username;
  try {
    const promises = await db.getAllPromises(senusername); // pass senusername as parameter
    return res.status(200).json(promises);
  } catch (err) {
    return res.status(500).json({ error: 'Error retrieving promises.' });
  }
});

router.post('/add-promise', checkAuthenticated, async (req, res) => {
  const { promise, recusername, sentAt } = req.body;
  const senusername = req.session.username;
  const status = 'active';

  try {
    await db.addPromise(promise, status, recusername, senusername, sentAt);
    return res.status(200).json({ message: 'Promise added successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error adding the promise.' });
  }
});

router.put('/update-promise/:id', checkAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.updatePromiseStatus(id, status);
    return res.status(200).json({ message: 'Promise status updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error updating the promise status.' });
  }
});

module.exports = router;
