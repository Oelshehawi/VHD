const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const app = express();
const fileupload = require("express-fileupload");

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// Needed to upload attachment
app.use(fileupload());

// Connecting to MongoDB
mongoose
  .connect("mongodb+srv://vercel-admin-user:dYzjvQE4eQ3jwncR@cluster0.dp154aw.mongodb.net/VHD?retryWrites=true&w=majority", {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

// Session middleware configuration
app.use(
  session({
    secret: "VHD-1990", // Replace with a secure secret key
    resave: false,
    saveUninitialized: false,
    // Add any other session options you need
  })
);

// Setting port that server will connect to can be accessed at 127.0.0.1:{port}
const port = process.env.PORT || 4000;

// Including routes
require("./routes/route.js")(app);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});