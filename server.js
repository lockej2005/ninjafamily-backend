const express = require('express');
const api = require('./api');

const app = express();
const port = 3000;

console.log('Initializing Server...');

// Body parser middleware
app.use(express.json());
app.use(express({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true if you're using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Use the api routes
app.use('/api', api);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
