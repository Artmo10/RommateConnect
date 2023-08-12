const express = require("express");
const app = express();
const port = 8080;
const dbConn = require("./db");
const path = require("path");
const session = require("express-session");
const multer = require('multer');
const upload = multer({ dest: 'assets/uploaded_img/' }); // Set the appropriate destination for uploaded files


// Set up the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'assets', 'views'));
//Configuring and enabling session management
app.use(session({
    secret: "roommate_secret",
    resave: false,
    saveUninitialized: true,
  })
);
// Enable Json formatting
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to read data from a post method
// Serve static files from the "assets" directory
app.use(express.static("assets"));

let newUserId = 0;
let currentUserId = 0;

// Define routes
app.get("/", (req, res) => {
  res.render("index", { msg: "" });
});

app.post("/", (req, res) => {
  let loginEmail = req.body.login_email;
  let loginPassword = req.body.login_password;
  console.log('retrieved email: ' + loginEmail)
  console.log('retrieved password: ' + loginPassword);
  // Query to verify if user exist in the database
  dbConn.query("SELECT * FROM User WHERE email = ?", loginEmail, function (err, results) {
    if (results) {
      console.log("Data of the user:");
      console.log(results);
      if (results.length > 0 && results[0].password === loginPassword) {
        console.log("Password matches");
        const userData = results[0];
        // Set info of user in session
        req.session.user_data = userData;
        currentUserId = results[0].user_id;
        // Redirect to profile
        res.redirect("/profile");
      } else {
        console.log("Invalid Password or Email");
        res.render("index", { msg: "Invalid Email or Password" });
      }
    }
    else { 
      console.log(err);
      console.log('Failed database connection');
      res.render("index", { msg: "Database connection failed" });
    }
  });
});

app.get("/register", (req, res) => {
  //res.sendFile(__dirname + "/assets/views/register.ejs");
  res.render("register", { error: '', success: ''});
});

app.post("/register", (req, res) => { 
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let email = req.body.email;
  let password = req.body.password;
  let birthdate = req.body.birthdate;
  let gender = req.body.gender;
  let preference = req.body.preference;

  // Creating object with user's data
  let form_data = {
    'first_name': firstName,
    'last_name': lastName,
    'email': email,
    'password': password,
    'birthdate': birthdate,
    'gender': gender,
    'roommate_preference': preference
  };
  // Query for adding new user into the database
  dbConn.query("INSERT INTO User SET ?", form_data, function (err, results) { 
    if (err) {
      console.log(err);
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        let errorMsg = 'Email already registered in our Database.'
        console.log(errorMsg);
        res.render('register', { error: `${errorMsg}` });
      }
      else { 
        res.render("register", { error: "Problem with user registration." });
      }
    }
    else { 
      console.log(results);
      newUserId = results.insertId;
      console.log('User added');
      let newProfileData = {
        'user_id': newUserId,
        'profile_picture': '',
        'additional_info': ''
      };
      dbConn.query("INSERT INTO Profile SET ?", newProfileData, function (err, results) { 
        console.log(results);
      });
      res.render("register", {success: 'Registration Successful!', error: '' });
    }
  });
  
});

app.get("/profile", function (req, res) { 
  if (!req.session.user_data) {
    console.log('User not logged in');
    res.redirect('/');
  }
  else { 
    dbConn.query("SELECT u.first_name, u.last_name, u.email, u.roommate_preference, p.additional_info FROM User u JOIN Profile p ON u.user_id = p.user_id WHERE u.user_id != ?", currentUserId, (err, rows) => { 
      res.render("profile", { user: req.session.user_data, people: rows });
    });
  }
});

app.get("/logout", function (req, res) { 
  req.session.destroy();
  res.redirect('/');
});

app.get("/account", (req, res) => {
  res.render("account", { user: req.session.user_data, error: "", success: ""});
});

app.post("/account", upload.single('picture'), (req, res) => {
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let email = req.body.email;
  let password = req.body.password;
  let birthdate = req.body.birthdate;
  let gender = req.body.gender;
  let preference = req.body.preference;
  let picture = req.file ? req.file.buffer : null; // Use req.file.buffer if file was uploaded, or null if not
  let info = req.body.info;
  // Printing in console info of the uploaded picture
  if (req.file) {
    console.log("Uploaded file:", req.file);
  }
  console.log('updated User Data');
  // Creating object with user's updated data
  let updated_user_data = {
    'first_name': firstName,
    'last_name': lastName,
    'email': email,
    'password': password,
    'birthdate': birthdate,
    'gender': gender,
    'roommate_preference': preference,
  };
  console.log(updated_user_data);
  console.log("updated Profile Data");
  let updated_profile_data = {
    'additional_info': info
  }
  if (req.file) {
    updated_profile_data["profile_picture"] = req.file.buffer;
  }
  console.log(updated_profile_data);
  dbConn.query("UPDATE user SET ? WHERE user_id = ?" , [updated_user_data, currentUserId], function (err, userResults) { 
    if (err) {
      console.log("Error updating USER table:" + err);
    } else { 
      console.log(userResults);
    }
  });

  dbConn.query("UPDATE profile SET ? WHERE user_id = ?", [updated_profile_data, currentUserId], function (err, profileResults) { 
    if (err) {
      console.log("Error updating PROFILE table: " + err);
    } else {
      console.log(profileResults);
    }
  });

  res.render("account", {
    user: req.session.user_data,
    error: "",
    success: "Data Updated",
  });
});

// testing database simple query
app.get("/all", (req, res) => {
  dbConn.query("SELECT * FROM user", (err, rows) => {
    if (err) {
      res.send(err);
    } else {
      res.send(rows);
    }
  });
});
// Wrong URL, redirect to page not found
app.use((req, res) => { 
  res.render("404_Error");
});
// Start the server
app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
