/* eslint-disable-next-line no-unused-vars */
export default function (err, req, res, next) {

  console.log('error-handler.js:3: ', err);
  // error handler logic
  res.sendStatus(500);
};