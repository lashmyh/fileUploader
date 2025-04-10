const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const validator = require('validator');
const logger = require('../utils/logger');


router.get('/', (req, res) => {
  res.redirect('/folders');
});

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/folders');
  res.render('login');
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/folders',
  failureRedirect: '/login',
  failureFlash: true,
}));

router.get('/signup', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/folders');
  res.render('signup');
});

router.post('/signup', async (req, res) => {
  const { name, email, password, password_confirm } = req.body;

    if (!validator.isEmail(email)) {
      req.flash('error_msg', 'Please enter a valid email address.');
      return res.redirect('/signup');
    }
    //check password match
    if (password !== password_confirm) {
        req.flash('error_msg', 'Passwords do not match!');
        return res.redirect('/signup');
    }

    // Check password length
    if (password.length < 6) {
        req.flash('error_msg', 'Password must be at least 6 characters!');
        return res.redirect('/signup');
    }

    //check email doesnt already exist
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        req.flash('error_msg', 'Email is already registered!');
        return res.redirect('/signup');
    }


  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    req.flash('success_msg', 'You are now registered and can log in!');
    res.redirect('/login');

  } catch (error) {
    logger.error('Error signing up: ' + error.message);
    req.flash('error_msg', 'Something went wrong! Please try again.');
    res.redirect('/signup');
  }
});

router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

module.exports = router;
