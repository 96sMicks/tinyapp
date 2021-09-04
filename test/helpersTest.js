const { assert } = require('chai');

const { emailVerifier } = require('../helpers/helpers.js');

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

describe('emailVerifier', function() {
  it('should return a user with valid email', function() {
    const user = emailVerifier("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    assert.equal(user.id, expectedOutput);
  });

  it('should return undefined with non-existent email', function() {
    const user = emailVerifier("user@example.coom", testUsers)
    const expectedOutput = undefined;
    assert.equal(user.id, expectedOutput);
  });

  
});