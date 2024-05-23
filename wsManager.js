const WebSocket = require('ws');

const deviceStatuses = {}; // Store the status for each device
let wss;

function initializeWebSocketServer(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', ws => {
    console.log('New client connected');

    ws.on('message', message => {
      const { deviceId, action } = JSON.parse(message);
      console.log(`Received message from ${deviceId}: ${action}`);

      if (action === "toggle") {
        deviceStatuses[deviceId] = deviceStatuses[deviceId] === "off" ? "on" : "off";
        broadcastStatus(deviceId);
      } else if (action === "status") {
        ws.send(JSON.stringify({ deviceId, status: deviceStatuses[deviceId] }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}

function broadcastStatus(deviceId) {
  if (wss) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ deviceId, status: deviceStatuses[deviceId] }));
      }
    });
  }
}

module.exports = {
  initializeWebSocketServer,
  getStatus: (deviceId) => deviceStatuses[deviceId] || "off",
  setStatus: (deviceId, status) => {
    deviceStatuses[deviceId] = status;
    broadcastStatus(deviceId);
  }
};
