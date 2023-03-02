// Import necessary modules
const express = require('express'); // Express web framework
const app = express(); // Create Express app instance
const jwt = require('jsonwebtoken'); // JSON Web Token for user authentication
const mongoose = require('mongoose'); // MongoDB object modeling tool
const bodyParser = require('body-parser'); // Middleware for parsing request body
const Post = require('./backend/model/Post'); // Post model
const Comment = require('./backend/model/Comment'); // Comment model
const localStorage = require('localStorage'); // HTML5 local storage
const pug = require('pug'); // Pug template engine
const cookieParser = require('cookie-parser'); // Middleware for parsing cookies
const cors = require('cors'); // Cross-origin resource sharing
const { secret } = require('./backend/auth/validateToken'); // Secret key for JWT validation
const User = require('./backend/model/User'); // User model

// Configure CORS
app.use(cors());

// Set the require method to app.locals
app.locals.require = require;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/developerBay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(() => {
  console.log('Connected to database' + mongoose.connection.name);
}).catch((error) => {
  console.log('Error connecting to database: ' + error);
});

// Configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure cookie parser
app.use(cookieParser());

// Set up routes
const postRoutes = require('./backend/api/posts');
const commentRoutes = require('./backend/api/comments');
const userRoutes = require('./backend/api/users');

app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes);
app.use("/comments", commentRoutes);

// Set up Pug as the templating engine
app.set('views', './frontend');
app.set('view engine', 'pug');

// Set up the homepage route
app.get('/', async (req, res) => {
  // Get the JWT from local storage
  const token = localStorage.getItem('token');
  console.log('Get /:: Token: ' + token);

  // Find all posts and comments in the database
  const posts = await Post.find({});
  const comments = await Comment.find({});

  if (token) {
    // If user is authenticated, decode JWT and find user in the database
    const userEncrypted = jwt.verify(token, secret);
    const user = await User.findById(userEncrypted.id);
    res.render('main', { title: 'Developer Bay', token: token, user: user, posts: posts, comments: comments });
  } else {
    // If user is not authenticated, render the homepage without user information
    res.render('main', { title: 'Developer Bay', token: null, user: null, posts: posts, comments: comments });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server is running on port ' + port);
});