const express = require("express");
const app = express();
const port = 8080;
const dbConn = require("./db");
const path = require("path");
const session = require("express-session");

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
    if (results.length > 0) {
      console.log("Data of the user:");
      console.log(results);
      if (results[0].password === loginPassword) {
        console.log("Password matches");
        const userData = results[0];
        // Set info of user in session
        req.session.user_data = userData;
        // Redirect to dashboard
        res.redirect("/dashboard");
      } else {
        console.log("Invalid Password");
        res.render("index", { msg: "Invalid Email or Password" });
      }
    }
    else { 
      console.log(err);
      console.log('Email not found');
      res.render("index", { msg: "Invalid Email or Password" });
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
  }
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
      console.log('User added');
      res.render("register", {success: 'Registration Successful!', error: '' });
    }
  });
  
});

app.get("/dashboard", function (req, res) { 
  if (!req.session.user_data) {
    console.log('User not logged in');
    res.redirect('/');
  }
  else { 
    res.render("dashboard", {user: req.session.user_data});
  }
  
});

app.get("/logout", function (req, res) { 
  req.session.destroy();
  res.redirect('/');
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

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
