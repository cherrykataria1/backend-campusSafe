//importing essential files and libraries
const express = require('express');
const database = require('../database');
const router = express.Router();

//importing auth and role files
var auth = require('../services/authentication');
var role = require('../services/checkRole');

//api for getting the details of total number of category, products and bills.

router.get('/getClasses',auth.authenticateToken, (req, res) => {
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

router.get('/:classId/getSubjects', auth.authenticateToken, (req, res) => {
    const classId = req.params.classId;
    const query = `
    SELECT subjects.subject_id, subjects.subject_name, COUNT(lecture.lecture_id) AS num_lectures
    FROM subjects
    LEFT JOIN lecture ON subjects.subject_id = lecture.subject_id
    LEFT JOIN class_subjects ON subjects.subject_id = class_subjects.subject_id
    WHERE class_subjects.class_id = ?
    GROUP BY subjects.subject_id, subjects.subject_name;
    `;

    database.query(query, [classId], (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Error retrieving subjects from the database",
                error: error
            });
        }
        res.status(200).json({
            message: "Subjects retrieved successfully",
            data: results
        });
    });
});

router.get('/getSubjects',auth.authenticateToken, (req, res) => {
    const queryy = `
        SELECT subjects.subject_id, subjects.subject_name, COUNT(cs.class_id) AS num_classes
        FROM subjects
        LEFT JOIN class_subjects cs ON cs.subject_id = subjects.subject_id
        GROUP BY subjects.subject_id, subjects.subject_name;
    `;

    database.query(queryy, (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Error retrieving subjects from the database",
                error: error
            });
        }
        res.status(200).json({
            message: "Subjects retrieved successfully",
            data: results
        });
    });
});

router.get('/:classId/getStudents',auth.authenticateToken, (req, res) => {
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

router.get('/studentsData/:userId',auth.authenticateToken, (req, res) => {
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

const getSubjectsForStudentQuery = `
    SELECT
        cs.subject_id,
        s.subject_name,
        t.full_name AS teacher_name
    FROM
        students st
        JOIN classes c ON st.class_id = c.class_id
        JOIN class_subjects cs ON c.class_id = cs.class_id
        JOIN subjects s ON cs.subject_id = s.subject_id
        JOIN teachers t ON cs.teacher_id = t.teacher_id
    WHERE
        st.student_id = ?;
`;

// SQL query to get the total number of lectures and attended lectures for each subject
const getLecturesForSubjectsQuery = `
    SELECT
        l.subject_id,
        COUNT(l.lecture_id) AS total_lectures,
        COUNT(a.attendance_id) AS attended_lectures
    FROM
        lecture l
        LEFT JOIN attendance a ON l.lecture_id = a.lecture_id AND a.student_id = ?
    WHERE
        l.subject_id IN (
            SELECT cs.subject_id
            FROM students st
            JOIN classes c ON st.class_id = c.class_id
            JOIN class_subjects cs ON c.class_id = cs.class_id
            WHERE st.student_id = ?
        )
    GROUP BY
        l.subject_id;
`;

// API endpoint to get subject details for a student
router.get('/:userId/subjects', auth.authenticateToken, async (req, res) => {
    const { userId } = req.params;

    database.query('SELECT student_id FROM students WHERE user_id = ?', [userId], (err, studentRows) => {
        if (err) {
            console.error('Error fetching student:', err);
            return res.status(500).json({ success: false, message: 'An error occurred while fetching student' });
        }

        if (!studentRows || studentRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const studentId = studentRows[0].student_id;

        database.query(getSubjectsForStudentQuery, [studentId], (err, subjectRows) => {
            if (err) {
                console.error('Error fetching subjects:', err);
                return res.status(500).json({ success: false, message: 'An error occurred while fetching subjects' });
            }

            if (!Array.isArray(subjectRows)) {
                return res.status(500).json({ success: false, message: 'Invalid subjects data format' });
            }

            database.query(getLecturesForSubjectsQuery, [studentId, studentId], (err, lectureRows) => {
                if (err) {
                    console.error('Error fetching lectures:', err);
                    return res.status(500).json({ success: false, message: 'An error occurred while fetching lectures' });
                }

                if (!Array.isArray(lectureRows)) {
                    return res.status(500).json({ success: false, message: 'Invalid lectures data format' });
                }

                const subjects = subjectRows.map(subject => {
                    const lectureData = lectureRows.find(l => l.subject_id === subject.subject_id) || {};
                    return {
                        ...subject,
                        total_lectures: lectureData.total_lectures || 0,
                        attended_lectures: lectureData.attended_lectures || 0
                    };
                });

                res.json({ success: true, data: subjects });
            });
        });
    });
});


router.get('/:studentId/subjects/:subjectId/attendance', (req, res) => {
    const studentId = req.params.studentId;
    const subjectId = req.params.subjectId;

    const query = `
        SELECT 
            l.lecture_id,
            l.lecture_date,
            l.lecture_details,
            w.location,
            IF(a.status IS NULL, 'absent', a.status) AS status
        FROM 
            lecture l
        LEFT JOIN 
            attendance a ON l.lecture_id = a.lecture_id AND a.student_id = ?
        INNER JOIN wifi_networks w ON l.wifi_id = w.wifi_id
        WHERE 
            l.subject_id = ?;
    `;

    database.query(query, [studentId, subjectId], (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Error retrieving lecture and attendance data from the database",
                error: error
            });
        }
        database.query('select subject_name from subjects where subject_id = ?',[subjectId],(err,resp)=>{
            if(err){
               return res.status(500).json({message: "Error retrieving subjectName data from the database",
               error: error}) ;
            }
            let subName = resp[0].subject_name;
            res.status(200).json({
                message: "Lecture and attendance data retrieved successfully",
                data: results,
                subName: subName
            });
        })
        
    });
});


router.get('/health-stats/:studentId',auth.authenticateToken, async (req, res) => {
    const { studentId } = req.params;
    const { duration } = req.query;

    // Get the appropriate time range based on the duration
    let fromDate;
    switch (duration) {
        case '1day':
            fromDate = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 1 day ago
            break;
        case '1week':
            fromDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 1 week ago
            break;
        case '2weeks':
            fromDate = new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)); // 2 weeks ago
            break;
        case '1month':
            fromDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)); // 1 month ago
            break;
        default:
            fromDate = null; // For all time
    }

    try {
        let query = `SELECT * FROM health_stats WHERE student_id = ?`;
        let params = [studentId];

        // If duration is specified, add a condition to filter by timestamp
        if (fromDate) {
            query += ` AND timestamp >= ?`;
            params.push(fromDate);
        }

        // Execute the query
        database.query(query, params, (err, result) => {
            if (err) {
                console.error('Error fetching health stats:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.json({ healthStats: result });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;