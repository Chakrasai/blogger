const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const upload = require('./upload'); 

// Models
const userModel = require('./models/user');
const blogModel = require('./models/blog');

// Constants
const app = express();
const secretKey = 'blog';

// Middleware
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect('mongodb+srv://blog:blog@blog.fffqn.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Authorization Middleware
const isLoggedIn = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    next();
  });
};
// User Registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const existingUser = await userModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const user = await userModel.create({ username, password });
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// User Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userModel.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (password !== user.password) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign({ username: user.username, id: user._id }, secretKey, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });
    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// User Profile
app.get('/profile', isLoggedIn, (req, res) => {
  res.json(req.user);
});

// User Logout
app.post('/logout', isLoggedIn, (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Create Blog Post
app.post('/postcreation', isLoggedIn, upload.single('image'), async (req, res) => {
  const { title, summary, content } = req.body;

  try {
    const imagePath = req.file ? `uploads/images/${req.file.filename}` : null;

    const post = await blogModel.create({
      title,
      summary,
      content,
      image: imagePath,
    });

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.posts.push(post._id);
    await user.save();

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get All Blog Posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await blogModel.find();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await blogModel.findById(id);
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
  }
 });

 app.get('/users/:id', async (req, res) => { 
   const {id} = req.params;
    try {
      const user = await userModel.findById(id).populate('posts');
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }

 });

app.listen(4000, () => console.log('Server is running on port 4000'));