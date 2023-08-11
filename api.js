const express = require('express');
const router = express.Router();
const db = require('./database');
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;
const redisKey = process.env.REDIS_ACCESS_KEY;

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

client.connect()
    .then(() => console.log("Connected to Redis"))
    .catch(err => console.log('Redis connect error: ', err));

function checkAuthenticated(req, res, next) {
    if (req.session && req.session.username) {
        next();
    } else {
        res.status(401).json({ message: 'User not logged in.' });
    }
}

router.use(session({
    store: new RedisStore({ client: client }),
    secret: redisKey,
    resave: false,
    saveUninitialized: false
}));

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string') {
        res.status(400).json({ message: 'Invalid data.' });
        return;
    }
    const user = await db.getUser(username, password);
    if (user) {
        req.session.username = username;
        res.status(200).json({ message: 'User logged in successfully.' });
    } else {
        res.status(401).json({ message: 'Invalid username or password.' });
    }
});

router.get('/get-promises', checkAuthenticated, async (req, res) => {
    const senusername = req.session.username;
    try {
        const promises = await db.getAllPromises(senusername);
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

router.get('/search-users', checkAuthenticated, async (req, res) => {
    const { searchTerm } = req.query;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Query parameter "searchTerm" is required.' });
    }

    try {
        const users = await db.searchUsers(searchTerm);
        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ error: 'Error searching users.' });
    }
});
router.post('/update-promise-score', checkAuthenticated, async (req, res) => {
    const { username, score } = req.body;
    
    try {
        await db.updateUserPromiseScore(username, score);
        return res.status(200).json({ message: 'Promise score updated successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Error updating promise score.' });
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

router.get('/get-promise-score/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const score = await db.getUserPromiseScore(username);
        if (score !== null) {
            return res.status(200).json({ promise_score: score });
        } else {
            return res.status(404).json({ message: 'User not found or no promise score available.' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Error retrieving promise score.' });
    }
});

router.get('/get-user/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const userProfile = await db.getUserProfile(username);
        if (userProfile) {
            return res.status(200).json(userProfile);
        } else {
            return res.status(404).json({ message: 'User not found.' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Error retrieving user profile.' });
    }
});

router.get('/get-received-promises', checkAuthenticated, async (req, res) => {
    const recusername = req.session.username;
    try {
        const promises = await db.getReceivedPromises(recusername);
        return res.status(200).json(promises);
    } catch (err) {
        return res.status(500).json({ error: 'Error retrieving received promises.' });
    }
});

router.get('/users/suggestions', checkAuthenticated, async (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    try {
        const suggestions = await db.getUserSuggestions(q);
        return res.status(200).json(suggestions);
    } catch (err) {
        return res.status(500).json({ error: 'Error retrieving user suggestions.' });
    }
});

module.exports = router;
