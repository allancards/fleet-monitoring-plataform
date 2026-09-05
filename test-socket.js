// test-socket.js
const io = require('socket.io-client');
const socket = io('ws://localhost:3001', { transports: ['websocket'] });
socket.on('connect', () => console.log('✅ Conectado'));
socket.on('vehicle-update', (data) => console.log('📡', data));
socket.on('disconnect', (reason) => console.log('❌ Desconectado:', reason));