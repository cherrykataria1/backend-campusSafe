const express = require('express');
const database = require('../database');
const router = express.Router();
const {broadcastToRelevantClients} = require('../wsManager')

// API endpoint to get teacher details using user ID
router.get('/teacher/:userId', async (req, res) => {
    const { userId } = req.params;

    // Define the query to fetch teacher details
    const getTeacherDetailsByUserIdQuery = `
        SELECT * FROM teachers WHERE user_id = ?;
    `;

    // Execute the query to fetch teacher details
    database.query(getTeacherDetailsByUserIdQuery, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching teacher details:', err);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while fetching teacher details',
                error: err
            });
        }

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
    });
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

router.get('/wifi', async (req, res) => {
    try {
        // Query to fetch all wifi locations and SSIDs
        const query = `
            SELECT wifi_id, ssid, location
            FROM wifi_networks;
        `;
        
        // Execute the query
        database.query(query, (err, result) => {
            if (err) {
                console.error('Error fetching wifi networks:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.json({ wifiNetworks: result });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/addLecture',  async (req, res) => {
    const { lecture_date, subject_id, class_id, lecture_details, wifi_id } = req.body;

    try {
        // Validate incoming data (you can add more validation as needed)

        // Query to insert a new lecture into the database
        const query = `
            INSERT INTO lecture (lecture_date, subject_id, class_id, lecture_details, wifi_id)
            VALUES (?, ?, ?, ?, ?);
        `;
        
        // Execute the query with the provided data
        database.query(query, [lecture_date, subject_id, class_id, lecture_details, wifi_id], (err, result) => {
            if (err) {
                console.error('Error posting new lecture:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                // Return success message or newly created lecture ID
                let loc;
                database.query('select location from wifi_networks where wifi_id =  ?',[wifi_id],(err,ress) =>{
                    if(err){
                        console.error('no wifi id location');
                    }
                    else{
                        console.log(res);
                        loc = ress[0].location;
                        console.log(loc);
                    }
                    const newLecture = { lecture_date, loc, lecture_details, subject_id, class_id };
                    console.log('adding new lecture',newLecture);
                    broadcastToRelevantClients({ type: 'VERIFY_ATTENDANCE', lecture: newLecture ,lectureId: result.insertId});
                    res.status(200).json({ message: 'New lecture posted successfully', lectureId: result.insertId });
                });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/classes/:classId/subjects/:subjectId/lectures/:lectureId/attendance', (req, res) => {
    const classId = req.params.classId;
    const subjectId = req.params.subjectId;
    const lectureId = req.params.lectureId;

    // Query to get teacher's name, students, and their attendance status
    const query = `
        SELECT 
            t.full_name AS teacher_name,
            s.full_name AS student_name,
            IF(a.status IS NULL, 'absent', a.status) AS attendance_status
        FROM 
            class_subjects cs
        INNER JOIN 
            teachers t ON cs.teacher_id = t.teacher_id
        INNER JOIN 
            students s ON s.class_id = cs.class_id
        LEFT JOIN 
            attendance a ON s.student_id = a.student_id AND a.lecture_id = ?
        WHERE 
            cs.class_id = ? AND cs.subject_id = ?;
    `;

    database.query(query, [lectureId, classId, subjectId], (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Error retrieving data from the database",
                error: error
            });
        }
        res.status(200).json({
            message: "Data retrieved successfully",
            data: results
        });
    });
});

module.exports = router;