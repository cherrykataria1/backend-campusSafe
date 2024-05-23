const express = require('express');
const { getStatus, setStatus } = require('../wsManager'); // Import the WebSocket manager
const router = express.Router();

router.get('/status/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  res.json({ status: getStatus(deviceId) });
});

router.post('/toggle/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const newStatus = getStatus(deviceId) === "off" ? "on" : "off";
  setStatus(deviceId, newStatus); // Update and broadcast the new status
  res.json({ status: newStatus });
});

module.exports = router;
