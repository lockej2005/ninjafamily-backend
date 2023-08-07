const express = require('express');
const router = express.Router();
const db = require('./database');
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;
const redisKey = process.env.REDIS_ACCESS_KEY;
console.log('n')



// Redis client configuration
const client = redis.createClient({
    legacyMode: true,
    url: redisUrl, 
    password: redisKey,
    tls: {
        rejectUnauthorized: false,
    },
    retry_strategy: function (options) {
        if (options.attempt > 10) {
            return undefined;
        }
        return options.attempt * 150;
    },
});

client.on('error', (err) => {
    console.log('Redis Client Error: ', err);
});

console.log('Connecting to Redis...');
client.connect()
    .then(() => console.log("Connected to Redis"))
    .catch(err => console.log('Redis connect error: ', err));

function checkAuthenticated(req, res, next) {
    console.log('Entering checkAuthenticated middleware...');
    if (req.session && req.session.username) {
        console.log('User authenticated');
        next();
    } else {
        res.status(401).json({ message: 'User not logged in.' });
    }
}
console.log('api.js test 1')
router.use(session({
    store: new RedisStore({ client: client }),
    secret: redisKey,
    resave: false,
    saveUninitialized: false
}));

router.post('/login', async (req, res) => {
    console.log('Handling /login POST request...');
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string') {
        res.status(400).json({ message: 'Invalid data.' });
        return;
    }
    const user = await db.getUser(username, password);
    if (user) {
        req.session.username = username;
        console.log(req.session);
        res.status(200).json({ message: 'User logged in successfully.' });
    } else {
        res.status(401).json({ message: 'Invalid username or password.' });
    }
});

router.get('/get-promises', checkAuthenticated, async (req, res) => {
    console.log('Handling /get-promises GET request...');
    const senusername = req.session.username;
    try {
        const promises = await db.getAllPromises(senusername);
        return res.status(200).json(promises);
    } catch (err) {
        return res.status(500).json({ error: 'Error retrieving promises.' });
    }
});

router.post('/add-promise', checkAuthenticated, async (req, res) => {
    console.log('Handling /add-promise POST request...');
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
    console.log(`Handling /update-promise/${req.params.id} PUT request...`);
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
