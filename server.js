const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

const { Schema } = mongoose;

const ExerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String },
  duration: { type: Number },
  date: Date,
});
const UserSchema = new Schema({
  username: String,
});
const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Excercise", ExerciseSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const newUser = new User({
    username: req.body.username,
  });
  newUser.save((err, data) => {
    if (err || !data) {
      res.send("There was an error saving the user");
    } else {
      res.json(data);
    }
  });
});

app.post("/api/users/:id/exercises", (req, res) => {
  const id = req.params.id;
  const { description, duration, date } = req.body;
  const dateFormatted = date ? new Date(date) : new Date();

  User.findById(id, (err, userData) => {
    if (err || !userData) res.send("could not find user");
    if (dateFormatted == "Invalid Date") {
      return res.json({ error: dateFormatted });
    }
    const newExercise = new Exercise({
      userId: id,
      description,
      duration,
      date: dateFormatted,
    });
    newExercise.save((err, data) => {
      if (err || !data) {
        res.send("There was an error saving this exercise");
      } else {
        const { description, duration, date, _id } = data;
        res.json({
          username: userData.username,
          description,
          duration,
          date: date.toDateString(),
          _id: userData.id,
        });
      }
    });
  });
});
app.get("/api/users/:id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  const { id } = req.params;
  User.findById(id, (err, userData) => {
    if (err || !userData) {
      res.send("could not find user");
    } else {
      let dateObj = {};
      if (from) {
        dateObj["$gte"] = new Date(from);
      }
      if (to) {
        dateObj["$lte"] = new Date(to);
      }
      let filter = {
        userId: id,
      };
      if (from || to) {
        filter.date = dateObj;
      }
      let nonNullLimit = limit ?? 0;
      Exercise.find(filter)
        .limit(+nonNullLimit)
        .exec((err, data) => {
          if (err || !data) {
            res.json({});
          } else {
            const count = data.length;
            const rawLog = data;
            const { username, _id } = userData;
            const log = rawLog.map((l) => ({
              description: l.description,
              duration: l.duration,
              date: l.date.toDateString(),
            }));
            res.json({ username, count, _id, log });
          }
        });
    }
  });
});
app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (!data) {
      res.send("no Users");
    } else {
      res.json(data);
    }
  });
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
