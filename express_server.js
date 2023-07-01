const express = require("express");
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

const app = express();

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Models
//const urlDatabase = {
//  "b2xVn2": "http://www.lighthouselabs.ca",
//  "9sm5xK": "http://www.google.com"
//};
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};
const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Helpers
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
const getUserByEmail = function(email) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};
const urlsForUser = function(id, urlDatabase) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};


// Routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req,res) => {
  res.locals.title = "TinyApp";
  const templateVars = { 
    user : users[req.cookies.user_id],
    urls : urlsForUser(req.cookies.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // check if user is logged in
  if (!req.cookies.user_id) {
    // user is not logged in, redirect to the login page
    res.redirect("/login");
  } else {
    // user is logged in, render the new URL form
    res.locals.title = "New URL - TinyApp Example";
    const templateVars = { 
      user : users[req.cookies.user_id],
      urls : urlDatabase 
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req,res) => {
  res.locals.title = "Register";
  const templateVars = {
    user : users[req.cookies.user_id]
  };
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

app.get("/login", (req, res) => {
  res.locals.title = "Login";
  const templateVars = {
    user : users[req.cookies.user_id]
  };
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  const shortURL = req.params.id;
  const urlEntry = urlDatabase[shortURL];

  // Check if user is logged in
  if (!userId) {
    res.status(401).send("You must be logged in to view this URL.");
    return;
  }

  // Check if the URL exists
  if (!urlEntry) {
    res.status(404).send("Short URL not found.");
    return;
  }

  // Check if the URL belongs to the logged-in user
  if (urlEntry.userID !== userId) {
    res.status(403).send("You do not have permission to view this URL.");
    return;
  }

  res.locals.title = "URL - TinyApp Example";
  const templateVars = {
    user: users[userId],
    urls: urlDatabase,
    id: shortURL,
    longURL: urlEntry.longURL,
  };
  res.render("urls_show", templateVars);
});


app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlEntry = urlDatabase[shortURL];
  if(urlEntry && urlEntry.longURL){
    res.redirect(urlEntry.longURL);
  } else {
    res.status(404).send("Short URL not found.");
  }
});

app.post("/urls", (req, res) => {
  // check if user is logged in
  if (!req.cookies.user_id) {
    // user is not logged in, respond with an error message
    res.status(403).send("You must be logged in to shorten URLs.");
    return;
  }
  // user is logged in, proceed with URL shortening
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userID = req.cookies.user_id;
  urlDatabase[shortURL] = {
    longURL : longURL,
    userID : userID
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }
  if (getUserByEmail(email)) {
    res.status(400).send("Email already exists. Please choose a different email address.");
  }

  const userId = generateRandomString();
  
  const newUser = {
    id : userId,
    email : email,
    password : password
  };

  users[userId] = newUser;

  res.cookie("user_id", userId);
  res.redirect("/urls");

});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);
  if (!user) {
    res.status(403).send("User not found");
  } else if (user.password !== password) {
    res.status(403).send("Incorrect Password");
  } else {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Reflect.has(userUrls, req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(401).send("You do not have authorization to delete this short URL.");
  }
});

app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Reflect.has(userUrls, req.params.id)) {
    const shortURL = req.params.id;
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.status(401).send("You do not have authorization to edit this short URL.");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});