const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(process.env.MLAB_URI || "mongodb://localhost/exercise-track");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  exercises: [{
    type: Schema.Types.ObjectId,
    ref: 'Exercise'
  }]
});

const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },

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
      curUser._id = user._id;
      // console.log(curUser);
      result.push(curUser)

    });

    res.send(result);
  });
});

app.post("/api/exercise/add", async (req, res) => {
const user = {}
await User.findOne({_id: req.body.userId}, (err, doc)=>{
  if (err) return console.error(err);
    user.id = doc._id
    user.username = doc.username
    const exercise = new Exercise({
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date || undefined
    });
    exercise.save((err, doc) => {})
  })
  await Exercise.find({userId: user.id}, (err, doc) =>{
    const allExercises = []
    doc.forEach(item =>{
      allExercises.push(item._doc)
    })
    user.exercises = allExercises
    // console.log('allExercises',allExercises);
  })

  // console.log('user',user);
  res.send({user})
});

// /api/exercise/log?{userId}[&from][&to][&limit]
app.get("/api/exercise/log", async (req, res) => {
  const userId = req.query.userId || null;
  // console.log("userId", userId);
  // Throw error if no user ID is provided
  if (!userId) {
    throw new Error("Please provide the UserID");
  }
  // const params = req.body.params
  const query = req.query;
  // console.log("query", query);


  const user = {}

  await User.findOne({_id: userId}, (err, doc)=>{
    // console.log(doc);
    if (err) return console.error(err);
      user.id = userId
      user.username = doc.username
    })
    await Exercise.find({userId: user.id}, (err, doc) =>{
      const allExercises = []
      doc.forEach(item =>{
        allExercises.push(item._doc)
      })
      user.log = allExercises
      user.count = allExercises.length
      // console.log('allExercises',allExercises);
    })

    // console.log('user',user);
    res.send({user})

  // Return user object with {log: [exercises], count: Int}
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
