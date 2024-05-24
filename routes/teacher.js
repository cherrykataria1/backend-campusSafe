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



module.exports = router;