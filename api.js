const express = require('express');
const router = express.Router();
const db = require('./database');
const session = require('express-session');
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./scratch'); // This creates a local storage directory named 'scratch'
const cors = require('cors');
require('dotenv').config();

router.use(cors({
    origin: ['http://localhost:19006'],
    credentials: true,
}));
    router.use((req, res, next) => {
        console.log('--- Incoming Request ---');
        console.log('Method:', req.method);
        console.log('URL:', req.originalUrl);
        console.log('Body:', req.body);
        console.log('Headers:', req.headers);
        console.log('Query Params:', req.query);
        next();
    });

    router.use((req, res, next) => {
        if (req.headers['x-session-id']) {
            req.sessionID = req.headers['x-session-id'];
        }
        next();
    });

 45

    router.use(session({
        store: new session.MemoryStore(),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        }
    }));




        function checkAuthenticated(req, res, next) {
            console.log('Session ID:', req.sessionID);
            console.log('Username:', req.session.username);
            if (req.session && req.session.username) {
                console.log('Session ID:', req.sessionID);
                console.log('Username:', req.session.username);
                next();
            } else {
                console.log('Authentication failed');
                res.status(401).json({ message: 'User not logged in.' });
            }
        }
        

        router.post('/signup', async (req, res) => {
            const { name, username, email, password, role, selectedAvatar } = req.body;
            console.log(req.body);
        
            if (!name || !username || !password || !role || !selectedAvatar) {
                res.status(400).json({ message: 'All fields except email are required.' });
                return;
            }
        
            try {
                if (role !== 'kid' && !email) {
                    res.status(400).json({ message: 'Email is required for roles other than kid.' });
                    return;
                }
        
                const existingUser = await db.authenticateUser(username, password);
                if (existingUser) {
                    res.status(400).json({ message: 'Username already exists.' });
                    return;
                }
        
                await db.addUser(name, username, email, password, role, selectedAvatar);
        
                // Save the user's session data (if needed)
                req.session.username = username;
        
                // Send a success response
                res.status(201).json({
                    message: 'User registered successfully.',
                    username: username,
                    sessionId: req.sessionID,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Error registering the user.' });
            }
        });
        
        

    router.get('/users', checkAuthenticated, async (req, res) => {
        try {
            const { username } = req.query;

            const userData = await db.getUserByUsername(username);
            
            res.status(200).json(userData);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching user data.' });
        }
    });

    router.get('/user-details', checkAuthenticated, async (req, res) =>{
        try {
            const { username } = req.query;

            const userDetails = await db.getUserDetails(username);
            res.status(200).json(userDetails)
        }catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching user details.' });
        }
    });

    router.post('/rewards', checkAuthenticated, async (req, res) => {
        try {
            const { username } = req.body;  // Get username from request body
      
            const rewardsData = await db.getRewardsByUsername(username);
            res.status(200).json(rewardsData);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching rewards data.' });
        }
      });
      

    router.get('/user-promises', checkAuthenticated, async (req, res) => {
        try {
            const { username } = req.query;

            const promisesData = await db.getPromisesByUsername(username);
            console.log(promisesData)
            res.status(200).json(promisesData);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching promises data.' });
        }
    });

    router.get('/family-members', checkAuthenticated, async (req, res) => {
        try {
            const { familyID } = req.query;

            const familyData = await db.getFamilyMembersByFamilyID(familyID);
            res.status(200).json(familyData);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching family data.' });
        }
    });
    router.get('/user-rewards', checkAuthenticated, async (req, res) => {
        try {
            const { username } = req.query;

            const userRewardsData = await db.getUserRewardsByUsername(username);

            res.status(200).json(userRewardsData);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching user rewards data.' });
        }
    });


    router.post('/login', async (req, res) => {
        const { username, password, userType } = req.body;
        
        if (!username || !password) {
            res.status(400).json({ message: 'Username and password are required.' });
            return;
        }
        
        try {
            const user = await db.authenticateUser(username, password);
            if (user) {
                const familyID = user.FamilyID;

                req.session.username = username;

                req.session.save((err) => {
                    if (err) {
                        console.error("Error saving session:", err);
                        return res.status(500).send("Server error");
                    }
                    res.status(200).json({ 
                        message: 'Logged in successfully.', 
                        username: username,
                        familyID: familyID,
                        userType: user.user_type,
                        sessionId: req.sessionID  // Sending session ID to frontend
                    });
                });
            } else {
                res.status(401).json({ message: 'Invalid username or password.' });
            }
        } catch (err) {
            res.status(500).json({ error: 'Error logging in the user.' });
        }
    });
    router.post('/add-reward', checkAuthenticated, async (req, res) => {
        const { usernames, reward, score } = req.body;

        if (!usernames || !reward || !score) {
            res.status(400).json({ message: 'Usernames, reward, and score are required.' });
            return;
        }

        try {
            await db.addRewardToUsers(usernames, reward, score);  
            res.status(201).json({ message: 'Reward added successfully.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error adding the reward.' });
        }
    });
    router.post('/update-promise-status', async (req, res) => {
        const { promiseID, status } = req.body;
        try {
            await db.updatePromiseStatus(promiseID, status);
            res.status(200).json({ message: 'Promise status updated successfully.' });
        } catch (error) {
            console.error("Error updating promise status:", error);
            res.status(500).json({ error: 'Error updating promise status.' });
        }
    });
    
    // Update the promise score of a user
    router.post('/update-promise-score', async (req, res) => {
        const { username, promiseScore } = req.body;
        try {
            await db.updatePromiseScore(username, promiseScore);
            res.status(200).json({ message: 'Promise score updated successfully.' });
        } catch (error) {
            console.error("Error updating promise score:", error);
            res.status(500).json({ error: 'Error updating promise score.' });
        }
    });
    
    // Get the promise score of a user
    router.get('/get-promise-score', async (req, res) => {
        const { username } = req.query;
        try {
            const data = await db.getPromiseScoreByUsername(username);
            res.status(200).json(data);
        } catch (error) {
            console.error("Error fetching promise score:", error);
            res.status(500).json({ error: 'Error fetching promise score.' });
        }
    });

    router.delete('/delete-reward', checkAuthenticated, async (req, res) => {
        const { rewardID } = req.body;
    
        if (!rewardID) {
            res.status(400).json({ message: 'RewardID is required.' });
            return;
        }
    
        try {
            await db.deleteReward(rewardID);
            res.status(200).json({ message: 'Reward deleted successfully.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error deleting the reward.' });
        }
    });
    
    router.get('/family-invite-code', checkAuthenticated, async (req, res) => {
        try {
            const { familyID } = req.query;
    
            if (!familyID) {
                res.status(400).json({ message: 'familyID is required.' });
                return;
            }
    
            const inviteCode = await db.getFamilyByID(familyID);

            if (inviteCode) {
                res.status(200).json({ inviteCode });  // send just the invite code
            } else {
                res.status(404).json({ message: 'Invite code not found for the given familyID.' });
            }
            
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching invite code.' });
        }
    });
    
    // Endpoint to set or update the invite code for a family
    router.post('/set-family-invite-code', checkAuthenticated, async (req, res) => {
        try {
            const { familyID, inviteCode } = req.body;
    
            if (!familyID || !inviteCode) {
                res.status(400).json({ message: 'familyID and inviteCode are required.' });
                return;
            }
    
            await db.setInviteCodeForFamily(familyID, inviteCode);
    
            res.status(200).json({ message: 'Invite code set/updated successfully.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error setting/updating invite code.' });
        }
    });

    router.post('/add-promise', checkAuthenticated, async (req, res) => {
        const { username, name, recurrence, RequestStatus, status } = req.body;
        
        // Get the current date
        const currentDate = new Date().toISOString();
        
        // Check for required fields
        if (!username || !name || !recurrence) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
    
        try {
            // Assuming there's a function in your database module to add a promise
            const insertedData = await db.addPromise(username, name, recurrence, RequestStatus, status, currentDate);
    
            res.status(201).json({ message: 'Promise added successfully.', insertedData });
        } catch (err) {
            console.error("Error adding promise:", err);
            res.status(500).json({ error: 'Error adding the promise.' });
        }
    });
    
    
    router.get('/user-suggestions', checkAuthenticated, async (req, res) => {
        const { query, familyID } = req.query;
        try {
            const suggestions = await db.getUserSuggestions(query, familyID); // Pass familyID to the database function
            res.status(200).json(suggestions);
        } catch (err) {
            console.error("Error fetching user suggestions:", err);
            res.status(500).json({ error: 'Error fetching user suggestions.' });
        }
    });
    
    router.post('/family-signup', checkAuthenticated, async (req, res) => {
        try {
            const { inviteCode } = req.body;
    
            if (!inviteCode) {
                res.status(400).json({ message: 'Invite code is required.' });
                return;
            }
    
            // Get the family details by invite code
            const familyDetails = await db.getFamilyByInviteCode(inviteCode);
    
            if (!familyDetails) {
                res.status(404).json({ message: 'Family not found for the given invite code.' });
                return;
            }
    
            // Get the username of the requesting user
            const { username } = req.session;
    
            // Update the familyID value of the user to the corresponding family
            await db.updateUserFamilyID(username, familyDetails.FamilyID);
    
            res.status(200).json({ message: 'Joined the family successfully.', familyDetails });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error joining the family.' });
        }
    });
    router.post('/create-family', checkAuthenticated, async (req, res) => {
        try {
            const { familyName, resetInterval, inviteCode, username } = req.body;
    
            if (!familyName || !resetInterval || !inviteCode || !username) {
                res.status(400).json({ message: 'All fields are required.' });
                return;
            }
    
            // Insert a new family record and get the familyID
            const familyID = await db.createFamily(familyName, resetInterval, inviteCode);
    
            if (!familyID) {
                res.status(500).json({ message: 'Failed to create a family.' });
                return;
            }
    
            // Assign the familyID to the user's record
            await db.assignFamilyIDToUser(username, familyID);
    
            res.status(201).json({ message: 'Family created successfully.', familyID });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error creating a family.' });
        }
    });
    module.exports = router;
