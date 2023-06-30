const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Models
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const users = {
  userRandomID: {
    id: "userRandomID",
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
    urls : urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.locals.title = "New URL - TinyApp Example";
  const templateVars = { 
    user : users[req.cookies.user_id],
    urls : urlDatabase 
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req,res) => {
  res.locals.title = "Register";
  const templateVars = {
    user : users[req.cookies.user_id]
  };  
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  res.locals.title = "Login";
  const templateVars = {
    user : users[req.cookies.user_id]
  };  
  res.render("urls_login", templateVars);
});

app.get("/urls/:id", (req, res) => {
  res.locals.title = "URL - TinyApp Example";
  const key = req.params.id;
  const templateVars = { 
    user : users[req.cookies.user_id],
    urls : urlDatabase,    
    id: key, 
    longURL: urlDatabase[key] 
  };
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
  
  // remove later
  console.log(users);
  
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

app.post("/urls/:id/delete", (req,res)=>{
  const id = req.params.id;
  if (Reflect.has(urlDatabase, id)) {
    delete urlDatabase[id];
    res.redirect("/urls");
  } else {
    res.status(404).send("URL not found");
  }
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.newURL;
  if (Reflect.has(urlDatabase, id)) {
    urlDatabase[id] = newURL;
    res.redirect("/urls");
  } else {
    res.status(404).send("URL not found");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});