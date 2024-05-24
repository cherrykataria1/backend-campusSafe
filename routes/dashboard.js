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

router.get('/studentsData/:userId', (req, res) => {
    const userId = req.params.userId;

    const queries = {
        getStudentInfo: `
            SELECT
                full_name AS student_name,
                date_of_birth,
                gender,
                class_id,
                student_id,
                status
            FROM students
            WHERE user_id = ?;
        `,
        queryFindClassInfo: `
        SELECT 
            cs.class_id as class_id,
            cs.subject_id as subject_id,
            sub.subject_name as subject_name,
            t.full_name AS teacher_name
        FROM class_subjects cs
        INNER JOIN subjects sub ON cs.subject_id = sub.subject_id
        INNER JOIN teachers t ON cs.teacher_id = t.teacher_id
        WHERE cs.class_id = ?;
    `,
        getLastFiveHealthStats: `
        SELECT 
            temp,
            heart_rate,
            loc,
            timestamp
        FROM (
            SELECT 
                *,
                ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY timestamp DESC) AS row_num
            FROM health_stats
        ) AS ranked_health_stats
        WHERE student_id = ?
        AND row_num <= 5;
    `
    };


    database.query(queries.getStudentInfo, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Error retrieving student info from the database",
                error
            });
        }
        if (results.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }
        const studentInfo = results[0];
        console.log(studentInfo);
        const classId = studentInfo.class_id;
        const studentId = studentInfo.student_id;
        let classdata;
        let className;
        let qry = 'Select class_name from classes where class_id = ?';
        database.query(qry,[classId],(err,cn) =>{
            className = cn[0].class_name;
        });
        database.query(queries.queryFindClassInfo, [classId], (error, classInfo) => {
            if (error) {
                return res.status(500).json({
                    message: "Error retrieving class info from the database",
                    error,
                    data: studentInfo
                });
            }
            classdata = classInfo;
            console.log(classInfo);
        });
        database.query(queries.getLastFiveHealthStats, [studentId], (error, healthStats) => {
            if (error) {
                return res.status(500).json({
                    message: "Error retrieving health stats of the student",
                    error,
                    data: studentInfo
                });
            }
            const info = {
                        name: studentInfo.student_name, 
                        studentId: studentId,
                        classId: classId,
                        className: className,
                        date_of_birth: studentInfo.date_of_birth,
                        gender: studentInfo.gender,
                        status: studentInfo.status,
                        classInfo: classdata,
                        healthStats
                    };
            return res.status(200).json({data:info});
        });
    });
});

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


router.get('/students/:studentId/subjects/:subjectId/attendance', (req, res) => {
    const studentId = req.params.studentId;
    const subjectId = req.params.subjectId;

    const query = `
        SELECT attendance_date, status
        FROM attendance
        WHERE student_id = ? AND subject_id = ?;
    `;

    database.query(query, [studentId, subjectId], (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Error retrieving attendance data from the database",
                error: error
            });
        }
        res.status(200).json({
            message: "Attendance data retrieved successfully",
            data: results
        });
    });
});


module.exports = router;