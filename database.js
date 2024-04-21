//using mysql for backend
const mysql = require('mysql');
require('dotenv').config();

//we have saved the mysql server credentials in .env file so importing form there to start the connection.
var database = mysql.createConnection({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

database.connect((error) =>{
    if(!error){
        console.log("Database Connected");
    }
    else{
        console.log(error);
    }
});

module.exports = database;