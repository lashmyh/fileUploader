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

initializePassport(passport);

const app = express();

//express middleware

app.use(express.static((__dirname + '/public')));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

//session middleware

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
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




app.listen(3000, () => console.log('Server running on http://localhost:3000'));
