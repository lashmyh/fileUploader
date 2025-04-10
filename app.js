const express = require('express');
const session = require('express-session');
const passport = require('passport');
const initializePassport = require('./passportConfig');
const authRoutes = require('./routes/auth');
const folderRouter = require('./routes/folderRouter');
const fileRouter = require('./routes/fileRouter');
const flash = require('connect-flash');
const multer = require('multer');
const uploadRouter = require('./routes/uploadRouter');

require('dotenv').config(); 
const PORT = process.env.PORT || 3000;

initializePassport(passport);

const app = express();

//express middleware

app.use(express.static((__dirname + '/public')));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1); // trust first proxy
}

//session middleware

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, 
    httpOnly: true,
    sameSite: 'lax'
  }
}));

//passport middleware

app.use(passport.initialize());
app.use(passport.session());



//flash middleware
app.use(flash());

// make flash messages available in all views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//application routes

app.use('/', authRoutes);
app.use('/folders', folderRouter);
app.use('/upload', uploadRouter);
app.use('/file', fileRouter);

//404 handler
app.use((req, res, next) => {
  res.status(404).render('404');
});




app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));