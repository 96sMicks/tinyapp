const express = require("express");
const app = express();
const PORT = 3000;
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const {
  generateRandomString,
  emailVerifier,
  authenticateUser,
} = require("./helpers/helpers.js");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: [
      "encryptinkeysomethingsomething",
      "encryptinkeysomethingsomethingagain",
    ],
  })
);

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
});

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "userRandomID",
  },
  m1cK3y: {
    longURL: "http://www.nba.com",
    userId: "user2RandomID",
  },
};

const saltRounds = 10;

// Hardcode for users Database
const hashedUser1Password = bcrypt.hashSync("111", 10);
const hashedUser2Password = bcrypt.hashSync("aaa", 10);

const usersDb = {
  userRandomID: {
    id: "userRandomID",
    email: "b@b.com",
    password: hashedUser1Password,
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "a@a.com",
    password: hashedUser2Password,
  },
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  if (!user) {
    return res
      .status(403)
      .send(
        `Please login first before accessing the page. Click <a href='/login'>here</a> to login.`
      );
  }

  const filteredUrlDatabase = {};

  // Looping through urlDatabase to find matching ids
  const urlsForUser = (id) => {
    for (const shortURL in urlDatabase) {
      if (id === urlDatabase[shortURL].userId) {
        filteredUrlDatabase[shortURL] = urlDatabase[shortURL];
      }
    }
  };

  urlsForUser(userId);

  const templateVars = { urls: filteredUrlDatabase, user };

  res.render("urls_index", templateVars);
});

// Creating a new shortURL and entering it in the urlDatabase
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  if (!user) {
    return res
      .status(403)
      .send(
        `Please login first before accessing the page. Click <a href='/login'>here</a> to login.`
      );
  }

  // Generate a random shortURL
  const shortURLId = generateRandomString();

  // Set the shortURL as a new key in the Db
  urlDatabase[shortURLId] = {};

  // extract the input from the form
  // const longURL = `http://${req.body.longURL}` better for now to use below b/c this one can't be used for httpS urls
  const longURL = req.body.longURL;

  // Setting the new shortURL key values in the database
  urlDatabase[shortURLId]["longURL"] = longURL;
  urlDatabase[shortURLId]["userId"] = userId;

  res.redirect(`/urls/${shortURLId}`);
});

// The delete route
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  if (!user) {
    return res
      .status(403)
      .send(
        `Please login first before accessing the page. Click <a href='/login'>here</a> to login.`
      );
  }

  delete urlDatabase[req.params.shortURL];

  res.redirect("/urls");
});

// Display login page
app.get("/login", (req, res) => {
  res.render("_login");
});

// Hanlde the Login route
app.post("/login", (req, res) => {
  // Extract the user info from the login form
  const { email, plainPassword } = req.body;

  // Must set password to hashed version to compare
  const password = bcrypt.hashSync(plainPassword, 10);

  if (emailVerifier(email, usersDb)) {
  } else {
    return res
      .status(403)
      .send(
        "Email cannot be found. Please register first before accessing the page. Click <a href='/register'>here</a> to register."
      );
  }

  const user = authenticateUser(email, plainPassword, usersDb);

  if (user) {
    req.session.user_id = user.id;

    res.redirect("/urls");
  } else {
    res.status(403).send("Wrong password.");
  }
});

// Logout route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Display register page
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  const templateVars = { user };

  res.render("_register", templateVars);
});

// Post register route
app.post("/register", (req, res) => {
  // error handling for empty password, email or duplicate email while resgistering new user
  if (req.body.email === "") {
    return res.status(400).send("Bad Request: Email is empty.");
  }

  if (req.body.plainPassword === "") {
    return res.status(400).send("Bad Request: Password is empty.");
  }

  // Calling emailVerifier on the new registered email
  if (emailVerifier(req.body.email, usersDb)) {
    return res.status(400).send("Email already registered.");
  }

  // Setting userId
  const userId = generateRandomString();

  // Getting the inputs email and password from form
  const { email, plainPassword } = req.body;

  // Hashing password
  const password = bcrypt.hashSync(plainPassword, saltRounds);

  // Creating a new user in userDb
  const newUser = {
    id: userId,
    email,
    password,
  };

  // Adding user info to userDb
  usersDb[userId] = newUser;

  //After adding user, setting a user_id cookie to our new generated id
  req.session.user_id = userId;

  res.redirect("/urls");
});

// This route is for using the shortId without being logged in
app.get("/u/:shortURLId", (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.shortURLId)) {
    const longURL = urlDatabase[req.params.shortURLId]["longURL"];
    res.redirect(longURL);
  }

  return res.status(400).send("Bad Request: This link hasn't been made.");
});

app.post("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  if (!user) {
    return res
      .status(403)
      .send(
        "Please login first before accessing the page. Click <a href='/login'>here</a> to login."
      );
  }

  const shortURL = req.params.shortURL;
  const longURL = req.body["newLongURL"];

  urlDatabase[shortURL].longURL = longURL;

  const filteredUrlDatabase = {};

  // Looping through urlDatabase to find matching ids
  const urlsForUser = (id) => {
    for (const shortURL in urlDatabase) {
      if (id === urlDatabase[shortURL].userId) {
        filteredUrlDatabase[shortURL] = urlDatabase[shortURL];
      }
    }
  };

  urlsForUser(userId);

  const templateVars = { urls: filteredUrlDatabase, user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  const templateVars = { urls: urlDatabase, user };

  if (!user) {
    return res
      .status(403)
      .send(
        `Please login first before accessing the page. Click <a href='/login'>here</a> to login.`
      );
  }

  res.render("urls_new", templateVars);
});

app.get("/", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  if (!user) {
    return res
      .status(403)
      .send(
        `Please login first before accessing the page. Click <a href='/login'>here</a> to login.`
      );
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  const shortURL = req.params.shortURL;

  if (!user) {
    return res
      .status(403)
      .send(
        `Please login first before accessing the page. Click <a href='/login'>here</a> to login.`
      );
  }

  if (!urlDatabase[shortURL]) {
    return res.status(403).send("This link doesn't exist");
  }
  if (user.id !== urlDatabase[shortURL].userId) {
    return res.status(403).send("Not your URL link.");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user,
  };

  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
