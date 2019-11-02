const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(process.env.MLAB_URI || "mongodb://localhost/exercise-track");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String
});

const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/test", (req, res) => {
  res.send("/test OK");
});
// app.get("/api/exercise/new-user", (req, res) => {
//   console.log(req.body.username);
//   res.send({user: req.body.username});
// });
app.post("/api/exercise/new-user", (req, res) => {
  const user = new User({
    username: req.body.username
  });
  // console.log(user);
  user.save((err, user) => {
    if (err) return console.error(err);
    // console.log(`${user} saved to DB`);
  });
  res.send({ username: user.username, id: user._id });
});
app.get("/api/exercise/users", (req, res) => {
  User.find({}, (err, users) => {
    const result = [];

    users.forEach(user => {
      const curUser = {}
      curUser.username = user.username;
      curUser.id = user._id;
      // console.log(curUser);
      result.push(curUser)

    });

    res.send(result);
  });
});

app.post("/api/excercise/add", (req, res) => {
  res.send("OK");
});

// /api/exercise/log?{userId}[&from][&to][&limit]
app.get("/api/exercise/log", (req, res) => {
  const userId = req.query.userId || null;
  console.log("userId", userId);
  // Throw error if no user ID is provided
  if (!userId) {
    throw new Error("Please provide the ID");
  }
  // const params = req.body.params
  const query = req.query;
  console.log("query", query);
  res.send("OK");
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
