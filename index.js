// importing essential Files and librries
const express = require('express');
var cors = require('cors');
const database = require('./database');
const userPath = require('./routes/user');
const categoryPath = require('./routes/category');
const productPath = require('./routes/product');
const billPath = require('./routes/bill');
const dashboardPath = require('./routes/dashboard');
const app = express();

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/user',userPath);
app.use('/category',categoryPath);
app.use('/product',productPath);
app.use('/bill',billPath);
app.use('/dashboard',dashboardPath);

module.exports = app;