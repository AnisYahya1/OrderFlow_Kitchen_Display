// Connect to Socket.io server
const socket = io();

// DOM element reference
const orderContainer = document.getElementById('orderContainer');

// Function to create an order card element
function createOrderCard(order) {
  const card = document.createElement('div');
  card.classList.add('order-card');

  // Create order header
  const header = document.createElement('div');
  header.classList.add('order-header');

  const orderNumberElem = document.createElement('div');
  orderNumberElem.classList.add('order-number');
  orderNumberElem.textContent = `#${order.orderNumber}`;

  const orderTimeElem = document.createElement('div');
  orderTimeElem.classList.add('order-time');
  orderTimeElem.textContent = order.createdAt;

  header.appendChild(orderNumberElem);
  header.appendChild(orderTimeElem);
  card.appendChild(header);

  // Create order items
  order.items.forEach(item => {
    const itemElem = document.createElement('div');
    itemElem.classList.add('item');

    const quantityElem = document.createElement('span');
    quantityElem.classList.add('item-quantity');
    quantityElem.textContent = item.quantity;

    const nameElem = document.createElement('span');
    nameElem.classList.add('item-name');
    nameElem.textContent = item.name;

    itemElem.appendChild(quantityElem);
    itemElem.appendChild(nameElem);

    if (item.notes && item.notes.trim() !== '') {
      const notesElem = document.createElement('div');
      notesElem.classList.add('item-notes');
      notesElem.textContent = item.notes;
      itemElem.appendChild(notesElem);
    }

    if (item.modifications && item.modifications.trim() !== '') {
      const modsElem = document.createElement('div');
      modsElem.classList.add('item-mods');
      modsElem.textContent = `Mods: ${item.modifications}`;
      itemElem.appendChild(modsElem);
    }

    card.appendChild(itemElem);
  });

  // Create a complete order button
  const completeBtn = document.createElement('button');
  completeBtn.classList.add('complete-btn');
  completeBtn.textContent = 'Complete Order';
  completeBtn.addEventListener('click', () => {
    socket.emit('orderCompleted', order.id);
    card.remove();
  });
  card.appendChild(completeBtn);

  return card;
}

// Listen for initial orders on connection
socket.on('initialOrders', orders => {
  orders.forEach(order => {
    const orderCard = createOrderCard(order);
    orderContainer.appendChild(orderCard);
  });
});

// Listen for new orders in real time
socket.on('newOrders', orders => {
  orders.forEach(order => {
    const orderCard = createOrderCard(order);
    // Add an animation class for visual effect on new orders
    orderCard.classList.add('new-order');
    orderContainer.appendChild(orderCard);
  });
});
