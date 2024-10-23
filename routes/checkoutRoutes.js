const express = require('express');
const router = express.Router();
const Order = require('../models/checkout'); // Ensure this points to your correct Order model

// Route for handling checkout form submission
router.post('/checkout', async (req, res) => {
    const { name, address, phone, email, note, paymentMethod, products } = req.body;

    const newOrder = new Order({
        name,
        address,
        phone,
        email,
        note,
        paymentMethod,
        products,
    });

    try {
        await newOrder.save();
        res.status(201).json({ message: 'Checkout successful!', order: newOrder });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ message: 'Error processing checkout.' });
    }
});

// Route for updating order status
router.post('/update-status/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const newStatus = req.body.status; // Ensure 'status' is provided in the request body

        // Find the order by ID and update its status
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });
        
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Respond with the updated order or a success message
        res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Route for processing orders
router.get('/process', async (req, res) => {
    try {
        const orders = await Order.find(); // Fetch all orders from your database
        res.render('process', { orders, message: req.flash('message') }); // Pass orders to the view
    } catch (error) {
        console.error("Error fetching orders: ", error);
        req.flash('message', 'Error fetching orders.');
        res.render('process', { orders: [], message: req.flash('message') }); // Pass an empty array if there's an error
    }
});

module.exports = router;
