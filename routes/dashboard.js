//importing essential files and libraries
const express = require('express');
const database = require('../database');
const router = express.Router();

//importing auth and role files
var auth = require('../services/authentication');
var role = require('../services/checkRole');

//api for getting the details of total number of category, products and bills.

router.get('/getClasses', (req, res) => {
    const queryy = `
        SELECT classes.class_id, classes.class_name, COUNT(students.student_id) AS num_students
        FROM classes
        LEFT JOIN students ON classes.class_id = students.class_id
        GROUP BY classes.class_id, classes.class_name;
    `;

    database.query(queryy, (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Error retrieving classes from the database",
                error: error
            });
        }
        res.status(200).json({
            message: "Classes retrieved successfully",
            data: results
        });
    });
});

module.exports = router;