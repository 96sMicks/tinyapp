const express = require("express");
const app = express();
const PORT = 3000;
const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs")

function generateRandomString() {
  let results = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const charactersLength = characters.length;

  for (let i = 0; i < 6; i++) {
    results += characters.charAt(Math.floor(Math.random() * 
 charactersLength ));
  }
  return results;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello! <b>World</b><html.\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase};
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
})

app.get("/urls/new", (req,res) => {
  res.render("urls_new");
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});