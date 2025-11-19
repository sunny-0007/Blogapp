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
app.get("/", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1});
  res.render("index", { posts });
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
  
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post Not Found");
  res.render("post", { post });
});

// Edit form
app.get("/edit/:id",requireLogin, async (req, res) => {
 
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post Not Found");
  res.render("edit", { post });
});

// Handle edit (FIXED variable errors)
app.post("/edit/:id",requireLogin,  async(req,res) =>{
  await Post.findByIdAndUpdate(req.params.id, req.body);
  res.redirect(`/post/${req.params.id}`);
})

// Delete post (FIXED variable name)
app.post("/delete/:id", requireLogin, async(req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

//Login page
app.get("/login", (req,res) =>{
  if(req.session.user)
    return res.redirect("/");
  res.render("login");
});

app.post("/login", async(req,res) =>{
  const {email, password} =req.body;
  const user = await User.findOne({ email, password});
  if(user){
    req.session.user = {
      id: user._id,
      name: user.name
    };
   return res.redirect("/");
  }
    res.send("Invalid Credentials");
  }
);

//Register page
app.get("/register", (req,res) =>{
  if(req.session.user) return res.redirect("/");
  res.render("register");
});

app.post("/register", async(req,res) =>{
  const {name, email, password} = req.body;
  try{
    const user = await User.create(req.body);
    req.session.user = {
      id:user._id,
      name : user.name
    };
    res.redirect("/");
  }catch(err){
    res.send("Email already exit try with different email");
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
