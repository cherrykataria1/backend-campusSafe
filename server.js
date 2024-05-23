require('dotenv').config();
// we are using dotenv file to save some enviornment data, to be changed

const http = require('http');
//we are creating routes and app in index.js file
const app = require('./index')
const { initializeWebSocketServer } = require('./wsManager'); 
const server = http.createServer(app);
initializeWebSocketServer(server); // Initialize the WebSocket server
//getting port number from .env file 
server.listen(process.env.PORT);