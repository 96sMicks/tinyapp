const bcrypt = require("bcrypt");

const emailVerifier = function(email, database)  {

  for(const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  } return false;
};

const authenticateUser = (email, plainPassword, usersDb) => {

  const userFound = emailVerifier(email, usersDb);
  if (userFound && bcrypt.compareSync(plainPassword, userFound.password)) {
    return userFound; 
  } 
  return false;
};

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

module.exports = {
  emailVerifier,
  authenticateUser,
  generateRandomString
}