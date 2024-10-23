// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// GET all products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.render('products', { products, message: req.flash('message') });
    } catch (err) {
        console.error('Error fetching products:', err);
        req.flash('message', 'Error fetching products');
        res.redirect('/index');
    }
});

// GET add product page
router.get('/add-product', (req, res) => {
    res.render('add-product', { message: req.flash('message') });
});

// POST add product
router.post('/add-product', async (req, res) => {
    const { name, description, price, image } = req.body;
    try {
        const newProduct = new Product({ name, description, price, image });
        await newProduct.save();
        req.flash('message', 'Product added successfully');
        res.redirect('/products');
    } catch (err) {
        console.error('Error adding product:', err);
        req.flash('message', 'Error adding product');
        res.redirect('/add-product');
    }
});

// GET edit product page
router.get('/edit-product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('message', 'Product not found');
            return res.redirect('/products');
        }
        res.render('edit-product', { product, message: req.flash('message') });
    } catch (err) {
        console.error('Error fetching product for editing:', err);
        req.flash('message', 'Error fetching product');
        res.redirect('/products');
    }
});

// POST edit product
router.post('/edit-product/:id', async (req, res) => {
    const { name, description, price, image } = req.body;
    try {
        await Product.findByIdAndUpdate(req.params.id, { name, description, price, image });
        req.flash('message', 'Product updated successfully');
        res.redirect('/products');
    } catch (err) {
        console.error('Error updating product:', err);
        req.flash('message', 'Error updating product');
        res.redirect('/edit-product/' + req.params.id);
    }
});

// DELETE product
router.get('/delete-product/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        req.flash('message', 'Product deleted successfully');
        res.redirect('/products');
    } catch (err) {
        console.error('Error deleting product:', err);
        req.flash('message', 'Error deleting product');
        res.redirect('/products');
    }
});

module.exports = router;
