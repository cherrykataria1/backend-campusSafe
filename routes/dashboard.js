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

router.get('/:classId/getStudents', (req, res) => {
    const classId = req.params.classId;

    const query = `
        SELECT students.student_id, students.full_name, students.date_of_birth, students.gender
        FROM students
        WHERE students.class_id = ?;
    `;

    database.query(query, [classId], (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Error retrieving students from the database",
                error: error
            });
        }
        res.status(200).json({
            message: "Students retrieved successfully",
            data: results
        });
    });
});

// router.get('/studentsData/:studentId', (req, res) => {
//     const studentId = req.params.studentId;

//     const query = `
//         SELECT 
//             s.full_name as full_name,
//             hs.height,
//             hs.weight,
//             hs.blood_pressure,
//             hs.heart_rate,
//             sub.subject_id,
//             sub.subject_name
//         FROM students s
//         LEFT JOIN (
//             SELECT 
//                 *,
//                 ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY timestamp DESC) AS row_num
//             FROM health_stats
//         ) hs ON s.student_id = hs.student_id AND hs.row_num <= 5
//         LEFT JOIN student_subjects ss ON s.student_id = ss.student_id
//         LEFT JOIN subjects sub ON ss.subject_id = sub.subject_id
//         WHERE s.student_id = ?;
//     `;

//     database.query(query, [studentId], (error, results) => {
//         if (error) {
//             return res.status(500).json({
//                 message: "Error retrieving student data from the database",
//                 error
//             });
//         }
//         const studentData = {
//             full_name: results[0].full_name,
//             healthStats: results.map(row => ({
//                 height: row.height,
//                 weight: row.weight,
//                 blood_pressure: row.blood_pressure,
//                 heart_rate: row.heart_rate
//             })),
//             subjectsEnrolled: results.map(row => ({
//                 subject_id: row.subject_id,
//                 subject_name: row.subject_name
//             }))
//         };
//         res.status(200).json({
//             message: "Student data retrieved successfully",
//             data: studentData
//         });
//     });
// });

router.post('/api/students/:studentId/health', (req, res) => {
    const studentId = req.params.studentId;
    const { height, weight, blood_pressure, heart_rate, other_stats } = req.body;

    // Validate input data
    if (!height || !weight || !blood_pressure || !heart_rate) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const healthData = {
        student_id: studentId,
        height: height,
        weight: weight,
        blood_pressure: blood_pressure,
        heart_rate: heart_rate,
        other_stats: other_stats
    };

    // Insert health data into the database
    database.query('INSERT INTO health_stats SET ?', healthData, (error, result) => {
        if (error) {
            console.error("Error inserting health stats:", error);
            return res.status(500).json({ message: "Failed to insert health stats into the database" });
        }
        res.status(201).json({ message: "Health stats inserted successfully" });
    });
});


module.exports = router;