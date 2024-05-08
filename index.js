// importing essential Files and librries
const express = require('express');
var cors = require('cors');
const database = require('./database');
const userPath = require('./routes/user');
const dashboardPath = require('./routes/dashboard');
const app = express();

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/user',userPath);
app.use('/dashboard',dashboardPath);

module.exports = app;