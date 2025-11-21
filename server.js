require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const sessionConfig = require("./config/session");
const { setUser, requireLogin } = require("./middleware/auth");


//models
const User = require("./models/user");
const Post = require("./models/post");
const connectDB = require("./config/db");

const app = express();
const PORT = 3000;

//connect to mongoDB
connectDB();

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));  // FIXED "extends" → "extended"
app.use(express.static("public"));
app.use(sessionConfig);
app.use(setUser);

// Data file
// const DATA_FILE = path.join(__dirname, "data", "posts.json");

// // Ensure data file exists
// if (!fs.existsSync(DATA_FILE)) {
//   fs.writeFileSync(DATA_FILE, JSON.stringify([]));
// }

// // Read posts
// function getPosts() {
//   return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
// }

// // Save posts
// function savePosts(posts) {
//   fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
// }

// Routes

// Home - list posts
// app.get("/", async (req, res) => {
//   const posts = await Post.find({author:req.session.user._id}).sort({ createdAt: -1});
//   res.render("index", { posts, user:req.session.user});
// });

// HOME PAGE – SMART ROUTE (this replaces your old app.get('/'))
app.get('/', async (req, res) => {
  if (req.session.user) {
    // USER IS LOGGED IN → show only THEIR posts
    const posts = await Post.find({ author: req.session.user._id })
                           .sort({ createdAt: -1 });
    res.render('index', { 
      posts, 
      user: req.session.user,
      isLoggedIn: true 
    });

  } else {
    // NOT LOGGED IN → show beautiful public landing page with demo content
    res.render('index', { 
      posts: [],           // no real posts
      user: null,
      isLoggedIn: false 
    });
  }
});

// Show create form
app.get("/create", requireLogin ,(req, res) => {
  res.render("create");
});

// Handle post creation (FIXED: must be POST route)
app.post("/create", requireLogin, async (req, res) => {


 await Post.create({
  title: req.body.title,
 content: req.body.content,
 author: req.session.user._id
});
  res.redirect("/");
});

// View single post
app.get("/post/:id",requireLogin, async(req, res) => {
  
  const post = await Post.findOne({ _id:req.params.id, author: req.session.user._id });
  if (!post) return res.status(404).send("Post Not Found");
  res.render("post", { post });
});

// Edit form
app.get("/edit/:id",requireLogin, async (req, res) => {
 
  const post = await Post.findById( { _id:req.params.id, author:req.session.user._id });
  if (!post) return res.status(404).send("Post Not Found");
  res.render("edit", { post });
});

// Handle edit (FIXED variable errors)
app.post("/edit/:id",requireLogin,  async(req,res) =>{
  await Post.findByIdAndUpdate({_id:req.params.id, author:req.session.user._id });
  res.redirect(`/post/${req.params.id}`);
})

// Delete post (FIXED variable name)
app.post("/delete/:id", requireLogin, async(req, res) => {
  await Post.findByIdAndDelete({_id:req.params.id, author:req.session.user._id});
  res.redirect("/");
});

//Login page
app.get("/login", (req,res) =>{
  if(req.session.user)
    return res.redirect("/");
  res.render("login");
});



// POST /login – THIS IS THE FIX
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // If user not found OR password wrong
    if (!user || user.password !== password) {
      return res.render('login', { 
        error: 'Invalid email or password' 
      });
    }

    // SUCCESS → Create session and redirect
    req.session.regenerate((err) => {
      if (err) return res.redirect('/login');

      req.session.user = user;           // ← This logs the user in
      req.session.save((err) => {        // ← Force save session
        if (err) return res.redirect('/login');
        res.redirect('/');               // ← THIS IS THE KEY LINE
      });
    });

  } catch (err) {
    res.render('login', { error: 'Something went wrong' });
  }
});

//Register page
app.get("/register",async (req,res) =>{
  if(req.session.user) return res.redirect("/");
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
      const user = await User.create(req.body);
      
      // FIX: store full user object (same as login)
      req.session.user = user;

      res.redirect("/");
  } catch (err) {
    res.send("Email already exists, try a different email");
  }
});





//Logout
app.get("/logout", (req,res) =>{
  req.session.destroy(() =>{
    res.redirect("/");
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Blog app listening at http://localhost:${PORT}`);
});
