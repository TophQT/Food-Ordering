const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming you have a User model

// Middleware for Flash Messages
const flash = require('connect-flash');
const session = require('express-session');

// Initialize flash and session middleware
router.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
router.use(flash());

// Admin login credentials
const adminCredentials = {
    email: 'roadtrip24@gmail.com',
    password: 'admin123'
};

// Signup Route (GET)
router.get('/signup', (req, res) => {
    res.render('signup', { message: req.flash('message') });
});

// Signup Route (POST)
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
        req.flash('message', 'All fields are required');
        return res.redirect('/signup');
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        req.flash('message', 'Passwords do not match');
        return res.redirect('/signup');
    }

    try {
        // Check if the user already exists by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('message', 'User already exists with this email');
            return res.redirect('/signup');
        }

        // Create a new user
        const newUser = new User({ firstName, lastName, email, phone, password });

        // Save the new user to the database
        await newUser.save();

        req.flash('message', 'User created successfully, please log in');
        return res.redirect('/login');
    } catch (err) {
        console.error('Error during signup:', err);
        req.flash('message', 'Signup failed, please try again.');
        return res.redirect('/signup');
    }
});

// Login Route (GET)
router.get('/login', (req, res) => {
    res.render('login', { message: req.flash('message') });
});

// Login Route (POST) - Includes admin login check
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Check if fields are filled
    if (!email || !password) {
        req.flash('message', 'All fields are required');
        return res.redirect('/login');
    }

    // Admin login check
    if (email === adminCredentials.email && password === adminCredentials.password) {
        req.session.isAdmin = true;
        req.flash('message', 'Admin login successful!');
        return res.redirect('/admin-dashboard'); // Redirect to the admin dashboard
    }

    try {
        // Find user by email (skip if admin)
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('message', 'User not found');
            return res.redirect('/login');
        }

        // Check password
        const isMatch = await user.comparePassword(password); // Assuming you have a comparePassword method in your User model
        if (!isMatch) {
            req.flash('message', 'Incorrect password');
            return res.redirect('/login');
        }

        // If successful, save user session and redirect to index.ejs
        req.session.userId = user._id;
        req.flash('message', 'Login successful!');
        return res.redirect('/index'); // Redirecting to index.ejs
    } catch (err) {
        console.error('Error during login:', err);
        req.flash('message', 'Login failed, please try again.');
        return res.redirect('/login');
    }
});

// Profile Route (GET)
router.get('/profile', async (req, res) => {
    try {
        const userId = req.session.userId; // Get user ID from session
        const user = await User.findById(userId);

        if (!user) {
            req.flash('message', 'User not found');
            return res.redirect('/login'); // Redirect if user not found
        }

        res.render('profile', { user }); // Render profile.ejs with user data
    } catch (err) {
        console.error('Error fetching profile:', err);
        req.flash('message', 'Error fetching profile');
        return res.redirect('/login'); // Redirect on error
    }
});

// Edit Profile Route (GET)
router.get('/edit-profile', async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user) {
            req.flash('message', 'User not found');
            return res.redirect('/login');
        }

        res.render('edit-profile', { user, message: req.flash('message') }); // Render edit profile page
    } catch (err) {
        console.error('Error fetching profile for editing:', err);
        req.flash('message', 'Error fetching profile for editing');
        return res.redirect('/profile'); // Redirect on error
    }
});

// Edit Profile Route (POST)
router.post('/edit-profile', async (req, res) => {
    const { firstName, lastName, email, phone } = req.body; // Get user details from form

    try {
        const userId = req.session.userId;
        await User.findByIdAndUpdate(userId, { firstName, lastName, email, phone }); // Update user details

        req.flash('message', 'Profile updated successfully');
        return res.redirect('/profile'); // Redirect to profile
    } catch (err) {
        console.error('Error updating profile:', err);
        req.flash('message', 'Error updating profile, please try again.');
        return res.redirect('/edit-profile'); // Redirect on error
    }
});

// Logout Route (GET)
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            req.flash('message', 'Logout failed, please try again.');
            return res.redirect('/index'); // Redirect on error
        }
        req.flash('message', 'Logout successful');
        res.redirect('/login'); // Redirect to login
    });
});

module.exports = router;
