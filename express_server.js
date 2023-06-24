const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function() {
  const length = 6;
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req,res) => {
  res.locals.title = "TinyApp";
  const templateVars = { urls : urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.locals.title = "New URL - TinyApp Example";
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  res.locals.title = "URL - TinyApp Example";
  const key = req.params.id;
  const templateVars = { id: key, longURL: urlDatabase[key] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  if(longURL){
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found.");
  }
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});