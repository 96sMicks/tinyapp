const express = require("express");
const app = express();
const PORT = 3000;
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs")

// Helper functions

function generateRandomString() {
  let results = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const charactersLength = characters.length;

  for (let i = 0; i < 6; i++) {
    results += characters.charAt(Math.floor(Math.random() * 
 charactersLength ));
  }
  return results;
};

// checks to see if email is already in userDb
const emailVerifier = function(email, database)  {

  for(const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  } return false;
};

const authenticateUser = (email, password, usersDb) => {

  const userFound = emailVerifier(email, usersDb);

  if (userFound && userFound.password === password) {
    return userFound;
  } 
  return false;
};



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const usersDb = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "b@b.com", 
    password: "111"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {

  const userId = req.cookies["user_id"];
  const user = usersDb[userId];

  const templateVars = { urls: urlDatabase, user  };
  
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {

  // Generate a random shortURL
  const shortURLId = generateRandomString();

  // extract the input from the form
  // const longURL = `http://${req.body.longURL}` better for now to use below b/c this one can't be used for httpS urls
  const longURL = req.body.longURL

  urlDatabase[shortURLId] = longURL
  res.redirect(`/urls/${shortURLId}`);
}); 

app.get("/u/:shortURLId", (req, res) => {
  const longURL = urlDatabase[req.params.shortURLId];
  res.redirect(longURL);
});

app.post("/urls/:shortURLId/delete", (req, res) => {
  delete urlDatabase[req.params.shortURLId];
  res.redirect("/urls")
});

// Display login page
app.get("/login", (req,res) => {

  const userId = req.cookies["user_id"];
  const user = usersDb[userId];

  const templateVars = { user }
  res.render("_login", templateVars)
})

// Login route
app.post("/login", (req, res) => {

  // Extract the user info from the login form 
  const { email, password } = req.body;


  // check if email is in userDb ---- ask about this
  if ((emailVerifier(email, usersDb))) {
  } else {
    return res.status(403).send('Email cannot be found')
  }

  const user = authenticateUser (email, password, usersDb)

  if (user) {
    // log the user in
    res.cookie('user_id', user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send('Wrong password.')
  }
});
    
  
  
  // const userId = req.cookies["user_id"];
  // const user = usersDb[userId];

  // const templateVars = { urls: urlDatabase, user  }


// Logout route

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls")
});

// Display register page

app.get("/register" , (req, res) => {
  const userId = req.cookies["user_id"];
  const user = usersDb[userId];

  const templateVars = { user }

  res.render("_register", templateVars)
});

// just for dev purpose to userDb updating --delete before submission

app.get('/users', (req, res) => {
  res.json(usersDb);
});


// Post register route

app.post("/register" , (req, res) => {

  // error handling for empty password, email or duplicate email while resgistering new user
  if (req.body.email === "") {
    return res.status(400).send('Bad Request')
  }

  if (req.body.password === "") {
    return res.status(400).send('Bad Request')
  }

  // Calling emailVerifier on the new registered email
  if (emailVerifier(req.body.email, usersDb)) {
    return res.status(400).send('Email already registered.')
  }

  // Setting userId
  const userId = generateRandomString();

  // Getting the inputs email and password from form
  const { email, password } = req.body

  // Creating a new user in userDb
 const newUser = {
    id: userId,
    email,
    password
  };

  // Adding user info to userDb
  usersDb[userId] = newUser

  
  //After adding user, setting a user_id cookie to our new generated id
  res.cookie("user_id", userId);

  res.redirect("/urls");
});

app.post("/urls/:shortURLId", (req, res) => {

  const userId = req.cookies["user_id"];
  const user = usersDb[userId];

  const longURL = req.body["newLongURL"];
  urlDatabase[req.params.shortURLId] = longURL
  const templateVars = { urls: urlDatabase, user };

  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req,res) => {
  const userId = req.cookies["user_id"];
  const user = usersDb[userId];

  const templateVars = { urls: urlDatabase, user }
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {

  const userId = req.cookies["user_id"];
  const user = usersDb[userId];

  const templateVars = {  shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], 
 user };
  res.render("urls_show", templateVars);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});