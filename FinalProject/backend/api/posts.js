const express = require('express');
const router = express.Router();
const Post = require('../model/Post');
const User = require('../model/User');
const Comment = require('../model/Comment');
const jwt = require('jsonwebtoken');
const { secret } = require('../auth/validateToken');
const localStorage = require('localStorage');
const { authMiddleware, notAuthMiddleware } = require('../auth/validateToken');
const pug = require('pug');


// Get posts by keyword. If the keyword is empty, return all posts. If the keyword is not empty, return the posts that match the keyword. If there are no posts that match the keyword, return an empty array
router.get('/search', async (req, res) => {
  try {
    // get the user from the token and set it as the author of the post
    const token = localStorage.getItem('token');
    console.log(token);
    let user = null;
    if (token) {
      const userEncrypted = jwt.verify(token, secret);
      user = await User.findById(userEncrypted.id);
    }
    let keyword = req.query.keyword;
    // if keyword is more than a word (e.g. "hello world"), split it into an array of words
    let post = await Post.find();
    console.log("Hay keyword");
    // remove leading and trailing spaces
    keyword = keyword.trim();
    console.log(keyword);
    // convert every n-space to a single space
    const keywords = keyword.trim().split(/\s+/); // Saneamos los espacios y convertimos en array
    if (!keywords || keywords.length === 0) {
      return res.render('main', { post, user });
    }
    const regexKeywords = keywords.map(k => new RegExp(k, 'i')); // Convertimos en regex case-insensitive
    try {
      const count = await Post.count({ title: { $in: regexKeywords } });
      const limit = 2;
      const page = req.query.page || 1;
      const totalPages = Math.ceil(count / limit);
      const posts = await Post.find({ title: { $in: regexKeywords } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
      res.render('main', { user, posts, totalPages, page });
    } catch (err) {
      console.error(err);
      res.render('main', { message: 'Error searching' });
    }
    // res.render('main', { post, user });
  } catch (err) {
    console.error(err);
    res.render('main', { message: 'Error searching' });
  }
});

router.get('/newPost', async (req, res) => {
  // check if the user is logged in
  const token = localStorage.getItem('token');
  if (token) {
    // decrypt the token
    const userEncrypted = jwt.verify(token, secret);
    // get the user from the database
    const user = await User.findById(userEncrypted.id);
    res.render('newPost', { user });
  } else {
    res.redirect('/users/login');
  }
});

// Add a new post
router.post('/create', authMiddleware, async (req, res) => {
  try {
    // get the user from the token and set it as the author of the post
    const token = localStorage.getItem('token');
    const userEncrypted = jwt.verify(token, secret);

    // getting the name of the user from the database
    let author = await User.findById(userEncrypted.id);
    const author_name = author.username;
    const title = req.body.title;
    const description = req.body.description;
    const content = req.body.content;
    const tags = req.body.tags.split(',');
    const language = req.body.language;
    const user_id = req.user.id;
    const createdAt = new Date();

    const post = new Post({ author, author_name, title, description, content, tags, language, user_id, createdAt });
    await post.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('newPost', { message: 'Error creating the post' });
  }
});

router.get('/edit/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.author == req.user.id) {
      res.render('editPost', { post });
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.error(err);
    res.render('editPost', { message: 'Error editing the post' });
  }
});
// Edit a post
router.post('/edit/post/:id', authMiddleware, async (req, res) => {
  try {
    // Check if  the user is the author of the post
    const post = await Post.findById(req.params.id);
    if (post.author != req.user.id) { return res.redirect('/'); }
    const title = req.body.title;
    const content = req.body.content;
    const description = req.body.description;
    const tags = req.body.tags.split(',');
    const language = req.body.language;

    post.title = title;
    post.content = content;
    post.description = description;
    post.tags = tags;
    post.language = language;
    post.updatedAt = Date.now();
    await post.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('editPost', { message: 'Error editing the post' });
  }
});

// If you want to delete a post, you must be logged in as the author of the post
router.post('/delete/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log(post.author);
    console.log(req.user.id);
    console.log(post.author == req.user.id);
    if (post.author == req.user.id) {
      await post.remove();
      res.redirect('/');
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.error(err);
    res.render('editPost', { message: 'Error deleting the post' });
  }
});

// Add a new comment to a post
router.post('/:postId/comments', async (req, res) => {
  try {
    const text = req.body.content;
    const post = await Post.findById(req.params.postId);
    // get the user from the token and set it as the author of the post
    const token = localStorage.getItem('token');
    const userEncrypted = jwt.verify(token, secret);
    const user = await User.findById(userEncrypted.id);
    console.log("User:" + user + "; " + "Post:" + post + "; " + "Text:" + text);
    if (!post) return res.render('post', { message: 'Post not found', user, post })
    const comment = new Comment({ text, post: post, user: user });
    await comment.save();
    post.comments.push(comment._id);
    await post.save();
    // res.redirect(`/posts/search/${req.params.postId}`);
    res.render('post', { post, user, comment });
  } catch (err) {
    console.error(err);
    res.render('post', { message: 'Error creating the comment' });
  }
});

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('main', { message: 'Error searching' });
  }
});

// Get a specific post
router.get('/search/:id', async (req, res) => {
  try {
    // get the user from the token and set it as the author of the post
    const token = localStorage.getItem('token');
    let user = null;
    let post = null;
    let comments = null;
    console.log(token);
    if (token) {
      const userEncrypted = jwt.verify(token, secret);
      user = await User.findById(userEncrypted.id);
      // Get all comments for the post
      console.log(post);
    }
    post = await Post.findById(req.params.id);
    comments = await Comment.find({ post: post });
    console.log("user: " + user);
    console.log("post: " + post);
    console.log("comments: " + comments);
    res.render('post', { post, user, comments });
  } catch (err) {
    console.error(err);
    res.render('main', { message: 'Error searching' });
  }
});
module.exports = router;
