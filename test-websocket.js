const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000?token=chrome_token');

ws.on('open', function open() {
  console.log('✅ WebSocket connection established');
  ws.close();
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket connection failed:', err.message);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
});
