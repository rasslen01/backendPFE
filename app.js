var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const http = require('http');
require('dotenv').config();

const { connectDB } = require('./config/db');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/userRouter');
var osRouter = require('./routes/osRouter');
var centreRouter = require('./routes/centreRouter');
var formationRouter = require('./routes/formationRouter');
var badgeRouter = require('./routes/badgeRouter');
var authRouter = require('./routes/authRouter');

const req = require('express/lib/request');

var app = express();



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/os' , osRouter)
app.use('/centres' , centreRouter);
app.use('/formations' , formationRouter);
app.use('/auth' , authRouter);
app.use('/' , badgeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json('error');
});

const server = http.createServer(app);

server.listen(process.env.Port , () => {
    connectDB();
  console.log(`Server is running on port ${process.env.Port}`);
});