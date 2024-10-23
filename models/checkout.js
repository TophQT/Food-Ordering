// models/order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Fields for customer details
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    note: { type: String, required: false },
    paymentMethod: { type: String, required: true },
    products: [
        {
            image: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
        },
    ],
    // Status of the order
    status: {
        type: String,
        enum: ['Pending', 'On my way', 'Cancelled', 'Order delivered'],
        default: 'Pending',
    },
    // Additional fields can be added here as needed
});

module.exports = mongoose.model('Checkout', orderSchema);
