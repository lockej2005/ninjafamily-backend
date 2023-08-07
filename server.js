const express = require('express');
const cors = require('cors');
const api = require('./api');

const app = express();
const port = 3000;

console.log('Initializing Server...');

app.use(cors({
    origin: function(origin, callback) {
        console.log('Handling CORS check for origin:', origin);
        callback(null, true);
    },
    credentials: true,
}));

app.use(express.json());
app.use('/api', api);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

