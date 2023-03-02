const mongoose = require('mongoose');
const User = require('../model/User');
const Post = require('../model/Post');
const Comment = require('../model/Comment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const localStorage = require('localStorage');
const { authMiddleware, notAuthMiddleware, secret } = require('../auth/validateToken');



router.get('/register', async (req, res) => {
    res.render('register', { title: 'Developer Bay' });
});
/**
 * @description Register a new user
 * @param {String} username
 * @param {String} email
 * @param {String} password
 * @param {String} role
 * @returns {String} 201
*/
router.post('/register', notAuthMiddleware, (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role || 'user';
    const newUser = new User({ username, password, email, role });

    console.log(newUser);
    // Check if the user already exists
    let userExists = false;
    User.find({}, function (err, users) {
        users.forEach(function (user) {
            if (user.username === username) {
                userExists = true;
                console.log('Username already in use', userExists);
            }
        });
    });

    if (userExists) {
        res.render('register', { title: 'Developer Bay', error: 'Username or email already in use' });
    } else {
        // Hash the password
        const salt = bcrypt.genSaltSync(10);
        newUser.password = bcrypt.hashSync(password, salt);

        // Save the user
        newUser.save().then(() => {
            res.render('login', { title: 'Developer Bay' });
        }).catch((error) => {
            console.log(error);
            res.status(500).send('Server error when registering a new user');
        });
    }
});

router.get('/login', async (req, res) => {
    res.render('login', { title: 'Developer Bay' });
});
/**
 * @description Login a user
 * @param {String} username
 * @param {String} password
 * @returns {JSON} token
 */
router.post('/login', notAuthMiddleware, async (req, res) => {
    // Get only the username and password from the request body. If more arguments are passed in, they will be ignored.
    const username = req.body.username;
    const password = req.body.password;

    // Find the user with the given username address
    const user = await User.findOne({ username });
    if (!user) {
        return res.render('login', { title: 'Developer Bay', error: 'Invalid username or password' });
    }

    console.log(user);

    // Check if the password is correct
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
        return res.render('login', { title: 'Developer Bay', error: 'Invalid username or password' });
    }

    // Generate a JWT
    const token = jwt.sign({ id: user._id }, 'your-secret-key', { expiresIn: '1d' });

    // Set the JWT in local storage, not as a cookie
    localStorage.setItem('token', token);

    // Get all posts
    const posts = await Post.find({});

    // Send the JWT back to the client
    // res.render('main', { title: 'Developer Bay', token: token, user: user, posts: posts });
    res.redirect('/');
});

router.get('/profile', authMiddleware, async (req, res) => {
    let user = await User.findById(req.user.id);
    let posts = await Post.find({ author: user._id });
    let comments = await Comment.find({ user: user._id });
    console.log('user: ', user);
    console.log('posts: ', posts);
    console.log('comments: ', comments);
    res.render('profile', { title: 'Developer Bay', user: user, posts: posts, comments: comments });
});

// GET profile edit page
router.get('/profile/edit', authMiddleware,(req, res) => {
    const token = localStorage.getItem('token');
    const userEncrypted = jwt.verify(token, secret);
    const user = User.findById(userEncrypted.id);
    res.render('editProfile', { title: 'Developer Bay', user: user });
});

// PUT update user information
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (req.body.email) {
            // if email is changed, check if it is already in use
            if (user.email !== req.user.email) {
                let emailExists = false;
                User.find({}, function (err, users) {
                    users.forEach(function (user) {
                        if (user.email === email) {
                            emailExists = true;
                            console.log('Email already in use', emailExists);
                            res.render('editProfile', { title: 'Developer Bay', user: user, message: 'Email already in use' });
                        }
                    });
                });
            }
            user.email = req.body.email;
        }
        user.username = req.body.username;
        user.password = req.body.password;
        // if username is changed, check if it is already in use
        if (user.username !== req.user.username) {
            let userExists = false;
            User.find({}, function (err, users) {
                users.forEach(function (user) {
                    if (user.username === username) {
                        userExists = true;
                        console.log('Username already in use', userExists);
                        res.render('editProfile', { title: 'Developer Bay', user: user, message: 'Username already in use' });
                    }
                });
            });
        }
        await user.save();
        res.render('profile', { title: 'Developer Bay', user: user });
    } catch (error) {
        console.log(error);
        res.render('profile', { title: 'Developer Bay', user: user, message: 'Error updating user' });
    }
});


// get for logout. It will redirect to post for logout
router.get('/logout', (req, res, next) => {
    // delete the cookie with the token in it 
    localStorage.removeItem('token');
    res.redirect('/');
});

/**
 * @description Get the current user
 * @returns {JSON} user
 */
router.get('/current', authMiddleware, (req, res, next) => {
    const token = localStorage.getItem('token');
    const userEncrypted = jwt.verify(token, secret);
    const user = User.findById(userEncrypted.id);
    const posts = Post.find({ user: user._id });
    const comments = Comment.find({ user: user._id });
    res.render('profile', { title: 'Developer Bay', user: req.user, posts: posts, comments: comments });
});

module.exports = router;

