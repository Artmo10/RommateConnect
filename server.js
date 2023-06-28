const express = require("express");
const app = express();
const port = 8080;
// Enable Json formatting
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to read data from a post method
// Serve static files from the "assets" directory
app.use(express.static("assets"));

// Define routes
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/register", (req, res) => { 
  const firstName = req.body.firstName;
  const gender = req.body.gender;

  console.log(firstName);
  console.log(gender);

  res.send('Form submitted successfully');
});


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
