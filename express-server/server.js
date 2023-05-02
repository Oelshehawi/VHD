const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const fileupload = require("express-fileupload");

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// Needed to upload attachment
app.use(fileupload());

//Connecting to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/VHD", {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

// Setting port that server will connect to can be accessed at 127.0.0.1:{port}
const port = process.env.PORT || 4000;

// Including routes
require("../express-server/routes/route")(app);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
