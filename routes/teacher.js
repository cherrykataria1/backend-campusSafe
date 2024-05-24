const express = require('express');
const database = require('../database');
const router = express.Router();


const getTeacherDetailsByUserIdQuery = `
    SELECT 
        t.teacher_id, 
        t.full_name, 
        u.username, 
        u.user_type
    FROM 
        teachers t
    JOIN 
        users u ON t.user_id = u.user_id
    WHERE 
        u.user_id = ?;
`;

// API endpoint to get teacher details using user ID
router.get('/teacher/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Execute the query to fetch teacher details
        const [rows] = await database.query(getTeacherDetailsByUserIdQuery, [userId]);
        
        // Check if a teacher was found
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Respond with the teacher details
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching teacher details:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching teacher details'
        });
    }
});

router.get('/classes/:teacherId', async (req, res) => {
    const { teacherId } = req.params;

    try {
        // Query to fetch classes taught by the teacher
        const query = `
            SELECT classes.class_id, classes.class_name
            FROM classes
            INNER JOIN class_subjects ON classes.class_id = class_subjects.class_id
            WHERE class_subjects.teacher_id = ?;
        `;
        
        // Execute the query with teacherId as parameter
        database.query(query, [teacherId], (err, result) => {
            if (err) {
                console.error('Error fetching classes:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.json({ classes: result });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/subjects/:teacherId/:classId', async (req, res) => {
    const { teacherId, classId } = req.params;

    try {
        // Query to fetch subjects taught by the teacher in the specific class
        const query = `
            SELECT subjects.subject_id, subjects.subject_name
            FROM subjects
            INNER JOIN class_subjects ON subjects.subject_id = class_subjects.subject_id
            WHERE class_subjects.teacher_id = ? AND class_subjects.class_id = ?;
        `;
        
        // Execute the query with teacherId and classId as parameters
        database.query(query, [teacherId, classId], (err, result) => {
            if (err) {
                console.error('Error fetching subjects:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.json({ subjects: result });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/lectures/:classId/:subjectId', async (req, res) => {
    const { classId, subjectId } = req.params;

    try {
        // Query to fetch all lectures by class ID and subject ID
        const query = `
            SELECT lecture.*,
                COUNT(attendance.student_id) AS attended_students,
                COUNT(students.student_id) AS total_students,
                (COUNT(attendance.student_id) / COUNT(students.student_id)) * 100 AS attendance_percentage
            FROM lecture
            LEFT JOIN attendance ON lecture.lecture_id = attendance.lecture_id
            LEFT JOIN students ON students.class_id = ? -- Filter by class ID
            WHERE lecture.class_id = ? AND lecture.subject_id = ?
            GROUP BY lecture.lecture_id;
        `;
        
        // Execute the query with classId and subjectId as parameters
        database.query(query, [classId, classId, subjectId], (err, result) => {
            if (err) {
                console.error('Error fetching lectures:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.json({ lectures: result });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;