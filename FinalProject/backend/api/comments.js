const express = require('express');
const router = express.Router();
const Post = require('../model/Post');
const Comment = require('../model/Comment');
const User = require('../model/User');
const { authMiddleware, notAuthMiddleware } = require('../auth/validateToken');
const pug = require('pug');
const jwt = require('jsonwebtoken');

// Create a new comment
router.post('/:id/comments', authMiddleware, async (req, res) => {
    try {
        const text = req.body.content;
        const post = await Post.findById(req.params.id);
        const user = req.body.user;
        const comment = new Comment({
            text, user, post: post._id
        });
        await comment.save();
        post.comments.push(comment._id);
        await post.save();
        res.redirect("/");
    } catch (err) {
        console.error(err);
        const post = await Post.findById(req.params.id);
        const user = req.body.user;
        res.render('post', { message: 'Error creating the comment', post, user });
    }
});





// Edit a comment
router.put('/comments/:id', authMiddleware, async (req, res) => {
    try {
        const text = req.body.text;
        // user is the user who is logged in. Can be accessed from the token
        const encryptedToken = req.cookies.token;
        const token = jwt.verify(encryptedToken, process.env.JWT_SECRET);
        const user = token.user;
        const comment = await Comment.findById(req.params.id);
        // check if the user is the owner of the comment
        if (comment.user != user.id) return res.render('main', { message: 'You are not authorized to edit this comment' });
        // update the comment
        comment.text = text;
        comment.updatedAt = Date.now();
        await comment.save();
        res.send('Comment updated');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Delete a comment
router.delete('/comments/:id', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        const post = await Post.findById(comment.post);
        post.comments = post.comments.filter(c => c != comment._id);
        await post.save();
        await comment.remove();
        res.send('Comment deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
