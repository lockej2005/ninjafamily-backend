const sql = require('mssql');
require('dotenv').config();
const dbUser = process.env.DB_USERNAME;
const dbPass = process.env.DB_PASSWORD;
const dbUrl = process.env.DB_URL;

const config = {
    user: dbUser,
    password: dbPass,
    server: dbUrl,
    database: 'ninjafamily',
    options: {
        encrypt: true,
    },
    connectionTimeout: 5 * 60 * 1000,
    requestTimeout: 5 * 60 * 1000,
};

const connectionPool = new sql.ConnectionPool(config).connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! ', err));

    const authenticateUser = async (username, password) => {
        try {
            const pool = await connectionPool;
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .query('SELECT * FROM users WHERE Username = @username');
            
            const user = result.recordset[0];
            
            if (user && password === user.Password) {
                delete user.Password; // Remove the password from the user object
                return user;
            } else {
                return null;
            }
        } catch (err) {
            console.log('Error running the query!', err);
            return null;
        }
    };
    
// Function to fetch user data based on the username
const getUserByUsername = async (username) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE username = @username');
        return result.recordset;
    } catch (err) {
        console.log('Error running the getUserByUsername query!', err);
        return null;
    }
};

const getUserDetails = async (username) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE username = @username');
        return result.recordset;
    } catch (err) {
        console.log('Error running the getUserDetails query!', err);
        return null;
    }
};

// Function to fetch rewards data based on the username
const getRewardsByUsername = async (username) => {
    try {
        const pool = await connectionPool;
        
        const searchPattern = `%${username}%`;
        
        const result = await pool.request()
            .input('searchPattern', sql.NVarChar, searchPattern)
            .query('SELECT * FROM RewardsTbl WHERE username LIKE @searchPattern');

        return result.recordset;
    } catch (err) {
        console.log('Error running the getRewardsByUsername query!', err);
        return null;
    }
};


// Function to fetch promises data based on the username
const getPromisesByUsername = async (username) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM PromiseTbl WHERE username = @username');
        return result.recordset;
    } catch (err) {
        console.log('Error running the getPromisesByUsername query!', err);
        return null;
    }
};
const getFamilyMembersByFamilyID = async (familyID) => {
    try {
        const pool = await connectionPool;
        
        const usersQuery = `
            SELECT * FROM users WHERE familyID = @familyID;
        `;
        const request = new sql.Request(pool);
        request.input('familyID', sql.Int, familyID);

        const result = await request.query(usersQuery);
        return result.recordset;
    } catch (error) {
        throw error;
    }
};
const getUserRewardsByUsername = async (username) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM RewardsTbl WHERE username = @username');
        return result.recordset;
    } catch (err) {
        console.log('Error running the userRewardsData query!', err);
        return null;
    }
};

const addUser = async (Name, username, email, password, userType, avatar) => {
    const promscore = '0';
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('PromiseScore', sql.NVarChar, promscore)
            .input('password', sql.NVarChar, password)
            .input('ProfilePic', sql.NVarChar, avatar)
            .input('Name', sql.NVarChar, Name)
            .input('Username', sql.NVarChar, username)
            .input('Email', sql.NVarChar, email)
            .input('user_type', sql.NVarChar, userType)
            .query('INSERT INTO users (PromiseScore, ProfilePic, Name, Username, Email, password, user_type) VALUES (@PromiseScore, @ProfilePic, @Name, @Username, @Email, @password, @user_type)');
        return result.rowsAffected;
    } catch (err) {
        console.log('Error running the addUser query!', err);
    }
};


const addRewardToUsers = async (usernames, reward, score) => {
    try {
        const pool = await connectionPool;
        
        await pool.request()
            .input('usernames', sql.NVarChar, usernames)
            .input('reward', sql.NVarChar, reward)
            .input('score', sql.Int, score)
            .query('INSERT INTO RewardsTbl (Username, Reward, Score) VALUES (@usernames, @reward, @score)');

    } catch (err) {
        console.log('Error running the addRewardToUsers query!', err);
        throw err;
    }
};
const updatePromiseStatus = async (promiseID, status) => {
    try {
        const pool = await connectionPool;
        if (status === "Delete") {
            await pool.request()
                .input('promiseID', sql.Int, promiseID)
                .query('DELETE FROM PromiseTbl WHERE PromiseID = @promiseID');
        } else {
            await pool.request()
                .input('promiseID', sql.Int, promiseID)
                .input('status', sql.NVarChar, status)
                .query('UPDATE PromiseTbl SET Status = @status WHERE PromiseID = @promiseID');
        }
    } catch (err) {
        console.log('Error updating or deleting promise in the database!', err);
        throw err;
    }
};


const updatePromiseScore = async (username, promiseScore) => {
    try {
        const pool = await connectionPool;
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('promiseScore', sql.Int, promiseScore)
            .query('UPDATE users SET PromiseScore = @promiseScore WHERE username = @username');
    } catch (err) {
        console.log('Error updating promise score in the database!', err);
        throw err;
    }
};

const getPromiseScoreByUsername = async (username) => {
    try {
        console.log('Fetching promise score for username:', username);  // Log the input
        
        const pool = await connectionPool;

        // Verify the connection pool
        if (!pool) {
            console.log('Connection pool is not available!');
            return null;
        }

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT PromiseScore FROM users WHERE username = @username');

        // Log the raw result
        console.log('Raw SQL query result:', JSON.stringify(result, null, 2));

        if (result.recordset && result.recordset.length > 0) {
            return result.recordset[0].PromiseScore;
        } else {
            console.log('No matching records found for username:', username);
        }
        
        return null;
    } catch (err) {
        console.log('Error fetching promise score from the database!', err);
        throw err;
    }
};

const deleteReward = async (rewardId) => {
    console.log('this is the ' + rewardId)
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('rewardId', sql.Int, rewardId)
            .query('DELETE FROM RewardsTbl WHERE RewardID = @rewardId');
        return result.rowsAffected;
    } catch (err) {
        console.log('Error running the deleteReward query!', err);
        return null;
    }
};

const getFamilyByID = async (familyID) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('familyID', sql.Int, familyID)
            .query('SELECT requestID FROM FamilyTbl WHERE FamilyID = @familyID');
            return result.recordset[0].requestID;  // assuming `requestID` is the invite code
    } catch (err) {
        console.log('Error running the getFamilyByID query!', err);
        throw err;
    }
};

const setInviteCodeForFamily = async (familyID, inviteCode) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('familyID', sql.Int, familyID)
            .input('inviteCode', sql.NVarChar, inviteCode)
            .query('UPDATE FamilyTbl SET requestID = @inviteCode WHERE familyID = @familyID');
        return result;
    } catch (err) {
        console.log('Error running the updateFamilyInfo query!', err);
        throw err;
    }
};

const addPromise = async (username, name, recurrence, RequestStatus, status, UpdateDate) => {
    try {
        const pool = await connectionPool;
        const defaultStatus = "Outgoing"; // Default value for status
        const insertQuery = `
            INSERT INTO PromiseTbl (username, name, recurrence, Status, RequestStatus, UpdateDate)
            OUTPUT inserted.*
            VALUES (@username, @name, @recurrence, @status, @RequestStatus, @UpdateDate)
        `;
        
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('name', sql.NVarChar, name)
            .input('recurrence', sql.NVarChar, recurrence)
            .input('RequestStatus', sql.NVarChar, RequestStatus)
            .input('status', sql.NVarChar, status)
            .input('UpdateDate', sql.DateTime, new Date(UpdateDate)) // pass the current date
            .query(insertQuery);

        console.log(result);
        const insertedData = result.recordset[0]; // Access the first row of the result
        console.log(insertedData);
        
        return insertedData; // Return the inserted data
    } catch (err) {
        console.log('Error running the addPromise query!', err);
        throw err;
    }
};


const getUserSuggestions = async (query, familyID) => {
    try {
        const pool = await connectionPool;
        const queryString = `%${query}%`;  // For SQL LIKE queries
        const result = await pool.request()
            .input('queryString', sql.NVarChar, queryString)
            .input('familyID', sql.Int, familyID) // Use familyID in the query
            .query('SELECT username FROM users WHERE username LIKE @queryString AND familyID = @familyID');
        return result.recordset.map(row => row.username);
    } catch (err) {
        console.log('Error running the getUserSuggestions query!', err);
        return null;
    }
};

const getFamilyByInviteCode = async (inviteCode) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('InviteCode', sql.NVarChar, inviteCode)
            .query('SELECT * FROM FamilyTbl WHERE requestID = @InviteCode');

        if (result.recordset.length > 0) {
            return result.recordset[0];
        } else {
            return null; // Invite code not found
        }
    } catch (err) {
        console.error('Error fetching family details by invite code:', err);
        throw err;
    }
};
const updateUserFamilyID = async (username, familyID) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('familyID', sql.Int, familyID)
            .query('UPDATE users SET familyID = @familyID WHERE username = @username');
        return result.rowsAffected;
    } catch (err) {
        console.log('Error running the updateUserFamilyID query!', err);
        throw err;
    }
};

const createFamily = async (familyName, resetInterval, inviteCode) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('familyName', sql.NVarChar, familyName)
            .input('resetInterval', sql.NVarChar, resetInterval)
            .input('inviteCode', sql.NVarChar, inviteCode)
            .query('INSERT INTO FamilyTbl (FamilyName, resetFreq, requestID) OUTPUT INSERTED.familyID VALUES (@familyName, @resetInterval, @inviteCode)');

        if (result.recordset.length > 0) {
            return result.recordset[0].familyID;
        } else {
            return null;
        }
    } catch (err) {
        console.log('Error running the createFamily query!', err);
        return null;
    }
};

// Function to assign the familyID to the user's record
const assignFamilyIDToUser = async (username, familyID) => {
    try {
        const pool = await connectionPool;
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('familyID', sql.Int, familyID)
            .query('UPDATE users SET familyID = @familyID WHERE username = @username');
    } catch (err) {
        console.log('Error running the assignFamilyIDToUser query!', err);
        throw err;
    }
};

module.exports = {
    authenticateUser,
    addUser,
    getUserByUsername,
    getRewardsByUsername,
    getPromisesByUsername,
    getFamilyMembersByFamilyID,
    getUserDetails,
    getUserRewardsByUsername,
    addRewardToUsers,
    updatePromiseStatus,
    updatePromiseScore,
    getPromiseScoreByUsername,
    deleteReward,
    setInviteCodeForFamily,
    getFamilyByID,
    addPromise,
    getUserSuggestions,
    getFamilyByInviteCode,
    updateUserFamilyID,
    createFamily,
    assignFamilyIDToUser,

};
