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
    console.log(`Fetching user with username: ${username} from DB...`);
    try {
        const pool = await connectionPool;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE username = @username');
        const user = result.recordset[0];

        console.log("Fetched user:", user);

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
    console.log(`Fetching all promises for user: ${senusername} from DB...`);
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
    console.log('Inserting promise into DB...');
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
    console.log(`Adding new user with username: ${username} to DB...`);
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
    console.log(`Updating promise with id: ${id} in DB...`);
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

module.exports = {
    getUser,
    getAllPromises,
    addPromise,
    addUser,
    updatePromiseStatus
};
