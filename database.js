const sql = require('mssql');
require('dotenv').config();
const dbUser = process.env.DB_USERNAME;
const dbPass = process.env.DB_PASSWORD;
const dbUrl = process.env.DB_URL;

const config = {
    user: dbUser,
    password: dbPass,
    server: dbUrl,
    database: 'promisedb',
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

const getUser = async (username, password) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE username = @username');
        const user = result.recordset[0];
        if (user && password === user.password) {
            delete user.password;
            return user;
        } else {
            return null;
        }
    } catch (err) {
        console.log('Error running the query!', err);
        return null;
    }
};

const getAllPromises = async (senusername) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('senusername', sql.NVarChar, senusername)
            .query('SELECT * FROM promises WHERE senusername = @senusername');
        return result.recordset;
    } catch (err) {
        console.log('Error running the query!', err);
    }
};

const addPromise = async (promise, status, recusername, senusername, sentAt) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('promise', sql.NVarChar, promise)
            .input('status', sql.NVarChar, status)
            .input('recusername', sql.NVarChar, recusername)
            .input('senusername', sql.NVarChar, senusername)
            .input('sentAt', sql.DateTime, new Date(sentAt))
            .query('INSERT INTO promises (promise, status, recusername, senusername, sentAt) VALUES (@promise, @status, @recusername, @senusername, @sentAt)');
        return result.rowsAffected;
    } catch (err) {
        console.log('Error running the query!', err);
    }
};

const addUser = async (username, password, email) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .input('email', sql.NVarChar, email)
            .query('INSERT INTO users (username, password, email) VALUES (@username, @password, @email)');
        return result.rowsAffected;
    } catch (err) {
        console.log('Error running the query!', err);
    }
};

const updatePromiseStatus = async (id, status) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE promises SET status = @status WHERE id = @id');
        return result.rowsAffected;
    } catch (err) {
        console.log('Error running the query!', err);
    }
};
const getReceivedPromises = async (recusername) => {
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('recusername', sql.NVarChar, recusername)
            .query('SELECT * FROM promises WHERE recusername = @recusername');
        return result.recordset;
    } catch (err) {
        console.log('Error running the query!', err);
        return [];
    }
};
const searchUsers = async (searchTerm) => {
    const searchQuery = `%${searchTerm}%`;
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('searchQuery', sql.NVarChar, searchQuery)
            .query('SELECT username, promise_score FROM users WHERE username LIKE @searchQuery');
        return result.recordset;
    } catch (err) {
        console.log('Error running the searchUsers query!', err);
        return [];
    }
};

const getUserSuggestions = async (query) => {
    const queryString = `%${query}%`;
    console.log(queryString);
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('query', sql.NVarChar, queryString)
            .query('SELECT username FROM users WHERE username LIKE @query');
            
        return result.recordset.map(row => row.username);
    } catch (err) {
        console.log('Error running the query!', err);
        return [];
    }
};

module.exports = {
    getUser,
    getAllPromises,
    addPromise,
    addUser,
    updatePromiseStatus,
    getUserSuggestions,
    getReceivedPromises,
    searchUsers
};
