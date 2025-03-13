const express = require('express');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Clover API configuration
const CLOVER_BASE_URL = process.env.CLOVER_BASE_URL;
const CLOVER_API_TOKEN = process.env.CLOVER_API_TOKEN;
const MERCHANT_ID = process.env.MERCHANT_ID;
const POLL_INTERVAL = 15000; // Poll every 15 seconds

// Store for processed orders to avoid duplicates
const processedOrders = new Set();

// Function to fetch orders from Clover API
async function fetchNewOrders() {
  try {
    // Get orders that are marked as "paid" but not yet "fulfilled"
    const response = await axios.get(
      `${CLOVER_BASE_URL}/v3/merchants/${MERCHANT_ID}/orders`,
      {
        params: {
          filter: 'state=paid&fulfillmentStatus=open',
          expand: 'lineItems',
        },
        headers: {
          'Authorization': `Bearer ${CLOVER_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const orders = response.data.elements;
    
    // Filter out orders we've already processed
    const newOrders = orders.filter(order => !processedOrders.has(order.id));
    
    // Add new orders to processed set
    newOrders.forEach(order => processedOrders.add(order.id));
    
    // Format orders for kitchen display
    const formattedOrders = newOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber || order.id.substring(0, 6),
      createdAt: new Date(order.createdTime).toLocaleTimeString(),
      items: order.lineItems.elements.map(item => ({
        name: item.name,
        quantity: item.quantity,
        notes: item.notes || '',
        modifications: item.modifications ? item.modifications.elements.map(mod => mod.name).join(', ') : ''
      }))
    }));

    return formattedOrders;
  } catch (error) {
    console.error('Error fetching orders from Clover:', error);
    return [];
  }
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Kitchen display connected');
  
  // Send initial data on connection
  fetchNewOrders().then(orders => {
    if (orders.length > 0) {
      socket.emit('initialOrders', orders);
    }
  });

  socket.on('orderCompleted', (orderId) => {
    // In a real implementation, you might update the order status in Clover here
    console.log(`Order ${orderId} marked as completed`);
    processedOrders.delete(orderId); // Remove from processed orders to allow it to be fetched again if not updated in Clover
  });
});

// Start polling for new orders
setInterval(() => {
  fetchNewOrders().then(newOrders => {
    if (newOrders.length > 0) {
      io.emit('newOrders', newOrders);
    }
  });
}, POLL_INTERVAL);

// Route to serve the kitchen display
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Kitchen display server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the kitchen display`);
});
