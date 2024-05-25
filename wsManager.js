const WebSocket = require('ws');
const database = require('./database');
const clients = new Map();
const clientws = new Map();
let wss;

function initializeWebSocketServer(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', ws => {
    console.log('New client connected');

    ws.on('message', message => {
      const parsedMessage = JSON.parse(message);
      console.log(`Received message from ${parsedMessage.studentId}: ${parsedMessage.action}`);

      if (parsedMessage.action === 'REGISTER') {
        // Register client by student_id and location
        clients.set(parsedMessage.studentId, { ws, location: parsedMessage.location });
        clientws.set(ws,parsedMessage.studentId);
    } else if (parsedMessage.action === 'ATTENDANCE_RESPONSE') {
        // Handle attendance response
        handleAttendanceResponse(parsedMessage);
    }else if (parsedMessage.action === 'HEALTH_STATS') {
        // Handle health stats data
        const { studentId, heart_rate, temp, loc } = parsedMessage;

        // Insert health stats data into the database
        const query = 'INSERT INTO health_stats (student_id, heart_rate, temp, loc) VALUES (?, ?, ?, ?)';
        database.query(query, [studentId, heart_rate, temp, loc], (err, res) => {
          if (err) {
            console.error('Error inserting health stats:', err);
          } else {
            console.log('Health stats inserted successfully for student:', studentId);
          }
        });
      } 
    });

    ws.on('close', () => {
        let studId = clientws.get(ws);
        console.log(`Client disconnected with student ID : ${studId}`);
        clients.delete(studId);
        clientws.delete(ws);
    });
  });
}

function broadcastToRelevantClients(data) {
    const lectureClassId = data.lecture.class_id;
    const lectureLocation = data.lecture.loc;

    // Query to get all students in the class
    const getStudentsInClassQuery = `
        SELECT student_id
        FROM students
        WHERE class_id = ?
    `;

    // Execute the query
    database.query(getStudentsInClassQuery, [lectureClassId], (err, results) => {
        if (err) {
            console.error('Error fetching students for class:', err);
            return;
        }

        const studentsInClass = results.map(row => row.student_id);

        clients.forEach((value, key) => {
            if (
                studentsInClass.includes(key) &&  // Check if the student is in the class
                value.location === lectureLocation &&   // Check if the location matches
                value.ws.readyState === WebSocket.OPEN // Check if the WebSocket connection is open
            ) {
                const output = {
                    action: data.type,
                    lectureId : data.lectureId,
                    studentId : data.lecture.student_id,
                    location : data.lecture.loc
                }
                value.ws.send(JSON.stringify(output));
            }
        });
    });
}
function handleAttendanceResponse(parsedMessage) {
    const { studentId, lectureId } = parsedMessage;

    // SQL query to insert the attendance entry
    const insertAttendanceQuery = `
        INSERT INTO attendance (student_id, lecture_id, status)
        VALUES (?, ?, 'present' , ?)
    `;

    // Execute the query
    database.query(insertAttendanceQuery, [studentId, lectureId], (err, results) => {
        if (err) {
            console.error('Error inserting attendance record:', err);
            return;
        }

        console.log('Attendance record inserted successfully for studentId:', studentId, 'lectureId:', lectureId);
    });
}

module.exports = {
  initializeWebSocketServer,
  broadcastToRelevantClients
};
