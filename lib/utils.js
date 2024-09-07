const bcrypt = require('bcrypt');
const { API_ERRORS } = require('./constants');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(plainTextPassword, hashedPassword) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
}

function serverErrorResponse(res) {
  return res.status(500).json({
    type: API_ERRORS.ServerError,
    message: 'A server error has occured',
  });
}

module.exports = {
  hashPassword,
  verifyPassword,
  serverErrorResponse,
};
