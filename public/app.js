// Connect to Socket.io server
const socket = io();

// DOM element reference
const orderContainer = document.getElementById('orderContainer');

// Order timers storage
const orderTimers = {};
