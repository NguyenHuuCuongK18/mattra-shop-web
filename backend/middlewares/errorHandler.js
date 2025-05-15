const { stack } = require("../routes/book.route");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.log(` [${statusCode}] ${message}`);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    //Chỉ hiện stack trace trong môi trường development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    message,
  });
};

module.exports = errorHandler;
