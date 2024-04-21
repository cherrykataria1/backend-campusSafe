require('dotenv').config();
// we are using dotenv file to save some enviornment data, to be changed

const http = require('http');
//we are creating routes and app in index.js file
const app = require('./index')
const server = http.createServer(app);
//getting port number from .env file 
server.listen(process.env.PORT);