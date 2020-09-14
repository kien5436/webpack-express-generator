/* eslint-disable-next-line no-unused-vars */
module.exports = function(err, req, res, next) {

  console.log('error-handler.js:3: ', err);
  // error handler logic
  res.sendStatus(500);
};