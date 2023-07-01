const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");
const PORT = 8080; // Default port 8080

const app = express();

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['RUSSELL'],
  maxAge: 24 * 60 * 60 * 1000, // Session cookie expires after 24 hours
}));
app.use(express.urlencoded({ extended: true }));

// Models
// ---------------
// In-memory database storing URLs and users
// This is for demonstration purposes only and should be replaced with a database in production
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


// Routes
// ---------------
// Root route
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// URLs index page
app.get("/urls", (req, res) => {
  res.locals.title = "TinyApp";
  // Pass the user's URLs to the template for rendering
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

// New URL form
app.get("/urls/new", (req, res) => {
  // Check if user is logged in
  if (!req.session.user_id) {
    // User is not logged in, redirect to the login page
    res.redirect("/login");
  } else {
    // User is logged in, render the new URL form
    res.locals.title = "New URL - TinyApp Example";
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlDatabase
    };
    res.render("urls_new", templateVars);
  }
});

// User registration page
app.get("/register", (req, res) => {
  res.locals.title = "Register";
  const templateVars = {
    user: users[req.session.user_id]
  };
  // If user is already logged in, redirect to the URLs index page
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

// User login page
app.get("/login", (req, res) => {
  res.locals.title = "Login";
  const templateVars = {
    user: users[req.session.user_id]
  };
  // If user is already logged in, redirect to the URLs index page
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

// Individual URL page
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
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

// Redirect to the longURL associated with a shortURL
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlEntry = urlDatabase[shortURL];
  if (urlEntry && urlEntry.longURL) {
    res.redirect(urlEntry.longURL);
  } else {
    res.status(404).send("Short URL not found.");
  }
});

// Create a new URL
app.post("/urls", (req, res) => {
  // Check if user is logged in
  if (!req.session.user_id) {
    // User is not logged in, respond with an error message
    res.status(403).send("You must be logged in to shorten URLs.");
    return;
  }
  
  // User is logged in, proceed with URL shortening
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userID = req.session.user_id;
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userID
  };
  res.redirect(`/urls/${shortURL}`);
});

// User registration
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }
  
  // Check if email already exists
  if (getUserByEmail(email, users)) {
    res.status(400).send("Email already exists. Please choose a different email address.");
    return;
  }

  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    id: userId,
    email: email,
    password: hashedPassword
  };

  users[userId] = newUser;

  req.session.user_id = userId;
  res.redirect("/urls");
});

// User login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("User not found");
    return;
  }
  
  // Check if the provided password matches the stored hashed password
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Incorrect Password");
    return;
  }
  
  req.session.user_id = user.id;
  res.redirect("/urls");
});

// User logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Delete a URL
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

// Edit a URL
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

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
