const { assert } = require('chai');

const { generateRandomString, getUserByEmail, urlsForUser } = require('../helpers.js');


describe('generateRandomString', function() {
  it('should return a random string of the specified length', function() {
    const length = 6;
    const randomString = generateRandomString(length);
    assert.strictEqual(randomString.length, length);
  });
});

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return null for a non-existent email', function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers);
    assert.equal(user, null);
  });

});

describe('urlsForUser', function() {
  it('should return URLs associated with the given user ID', function() {
    const urlDatabase = {
      abcdef: { longURL: 'http://www.example.com', userID: 'user1' },
      ghijkl: { longURL: 'http://www.example.org', userID: 'user2' },
      mnopqr: { longURL: 'http://www.example.net', userID: 'user1' },
    };
    const userID = 'user1';
    const userUrls = urlsForUser(userID, urlDatabase);
    const expectedUrls = {
      abcdef: { longURL: 'http://www.example.com', userID: 'user1' },
      mnopqr: { longURL: 'http://www.example.net', userID: 'user1' },
    };
    assert.deepEqual(userUrls, expectedUrls);
  });

  it('should return an empty object if no URLs are associated with the given user ID', function() {
    const urlDatabase = {
      abcdef: { longURL: 'http://www.example.com', userID: 'user1' },
      ghijkl: { longURL: 'http://www.example.org', userID: 'user2' },
    };
    const userID = 'user3';
    const userUrls = urlsForUser(userID, urlDatabase);
    assert.deepEqual(userUrls, {});
  });
});