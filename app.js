const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const authRoutes = require('./routes/authRoutes'); // Adjust the path if necessary
const Product = require('./models/product'); // Adjust the path for the product model
const Checkout = require('./models/checkout'); // Import Checkout model
const checkoutRoutes = require('./routes/checkoutRoutes'); // Import checkout routes

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your_secret_key', // Change this to your own secret
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

// Serve static files (for serving images, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine (using EJS)
app.set('view engine', 'ejs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Ordering', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Set up storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Destination folder for uploaded images
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp + original file extension
    }
});

// Initialize multer
const upload = multer({ storage: storage });

// Home Route to serve index.ejs
app.get('/index', (req, res) => {
    res.render('index', { message: req.flash('message') });
});

// Admin Dashboard Route
app.get('/admin-dashboard', async (req, res) => {
    if (req.session.isAdmin) {
        try {
            const productCount = await Product.countDocuments(); // Fetch the count of products from the database
            res.render('dashboard', { productCount }); // Pass the count to the dashboard view
        } catch (error) {
            console.error('Error fetching product count:', error);
            req.flash('message', 'Error fetching product count.');
            res.redirect('/admin-dashboard'); // Redirect to dashboard on error
        }
    } else {
        req.flash('message', 'Access denied');
        res.redirect('/login'); // Redirect to login if not admin
    }
});

// Route for Add Product Page
app.get('/addproduct', (req, res) => {
    if (req.session.isAdmin) {
        res.render('addproduct', { message: req.flash('message') }); // Render addproduct.ejs
    } else {
        req.flash('message', 'Access denied');
        res.redirect('/login'); // Redirect to login if not admin
    }
});

// Route for adding a new product
app.post('/add-product', upload.single('image'), (req, res) => {
    const { name, description, price } = req.body;
    const imagePath = `/images/${req.file.filename}`; // Get the path for the uploaded image

    const newProduct = new Product({ name, description, price, image: imagePath }); // Add image path to the product

    newProduct.save()
        .then(() => {
            req.flash('message', 'Product added successfully!');
            res.redirect('/addproduct');
        })
        .catch(err => {
            console.error(err);
            req.flash('message', 'Error adding product.');
            res.redirect('/addproduct');
        });
});

// Route for viewing all products
app.get('/products', (req, res) => {
    if (req.session.isAdmin) {
        Product.find() // Fetch all products from the database
            .then(products => {
                res.render('product', { products: products, message: req.flash('message') }); // Render product.ejs with the fetched products
            })
            .catch(err => {
                console.error(err);
                req.flash('message', 'Error fetching products.');
                res.redirect('/admin-dashboard'); // Redirect to dashboard on error
            });
    } else {
        req.flash('message', 'Access denied');
        res.redirect('/login'); // Redirect to login if not admin
    }
});

// Route for editing a product (GET)
app.get('/editproduct/:id', (req, res) => {
    if (req.session.isAdmin) {
        Product.findById(req.params.id)
            .then(product => {
                if (product) {
                    res.render('editproduct', { product: product, message: req.flash('message') }); // Render editproduct.ejs with the product data
                } else {
                    req.flash('message', 'Product not found.');
                    res.redirect('/products');
                }
            })
            .catch(err => {
                console.error(err);
                req.flash('message', 'Error fetching product.');
                res.redirect('/products');
            });
    } else {
        req.flash('message', 'Access denied');
        res.redirect('/login'); // Redirect to login if not admin
    }
});

// Route for updating a product (POST)
app.post('/update-product/:id', upload.single('image'), (req, res) => {
    const { name, description, price } = req.body;
    const imagePath = req.file ? `/images/${req.file.filename}` : undefined; // Check if a new image was uploaded

    Product.findByIdAndUpdate(req.params.id, { name, description, price, ...(imagePath && { image: imagePath }) }, { new: true }) // Update the product
        .then(() => {
            req.flash('message', 'Product updated successfully!');
            res.redirect('/products');
        })
        .catch(err => {
            console.error(err);
            req.flash('message', 'Error updating product.');
            res.redirect('/products');
        });
});

// Route for deleting a product
app.post('/delete-product/:id', (req, res) => {
    const productId = req.params.id;

    Product.findByIdAndDelete(productId)
        .then(() => {
            req.flash('message', 'Product deleted successfully!');
            res.redirect('/products'); // Redirect to products list after deletion
        })
        .catch(err => {
            console.error(err);
            req.flash('message', 'Error deleting product.');
            res.redirect('/products');
        });
});

// New Route for displaying the menu
app.get('/menu', async (req, res) => {
    try {
        const products = await Product.find(); // Fetch products from your MongoDB collection
        res.render('menu', { products }); // Render menu.ejs with the fetched products
    } catch (error) {
        console.error("Error fetching products: ", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route for processing orders
app.get('/process', async (req, res) => {
    try {
        const orders = await Checkout.find(); // Fetch all orders from your database
        res.render('process', { orders, message: req.flash('message') }); // Pass orders to the view
    } catch (error) {
        console.error("Error fetching orders: ", error);
        req.flash('message', 'Error fetching orders.');
        res.render('process', { orders: [], message: req.flash('message') }); // Pass an empty array if there's an error
    }
});

// Route for deleting an order by ID
app.delete('/api/delete-order/:id', (req, res) => {
    const orderId = req.params.id;

    // Logic to delete the order from the database using the orderId
    Checkout.findByIdAndDelete(orderId)
        .then(() => {
            res.status(200).send({ message: 'Order deleted successfully' });
        })
        .catch(err => {
            console.error('Error deleting order:', err);
            res.status(500).send({ message: 'Error deleting order' });
        });
});

// Use authentication routes
app.use('/', authRoutes);

// Use checkout routes
app.use('/api', checkoutRoutes); // Ensure this comes after your other routes

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
