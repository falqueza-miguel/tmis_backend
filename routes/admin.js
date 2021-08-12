const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const User = require('../models/user');
const Prereg = require('../models/prereg');

const isAuth = require('../middleware/is-auth');
const { isAdmin } = require('../middleware/is-role')

//deal with default passwords later, could use birthdate for students and parents only
router.post('/admin/createuser', isAuth, isAdmin, body('email').isEmail(), (req, res) => {

    const errors = validationResult(req); //validates if email is an actual email
    if (!errors.isEmpty()){
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    const email = req.body.email;//input from frontend here
    const password = 'password';//default password here

    User.findOne({ email: email })
    .then(userDoc => {//authentication and creation
        if (userDoc){//checks if already exists, could be redundant code(?)
            console.log('user already exists in users coll');
            return res.redirect('/');//user already exists, redirects to home page for now
        }
        Prereg.findOne({ email: email })//checks if email used already exists in prereg too, optimize this
        .then(userDoc => {
            if (userDoc){
                console.log('student email is in use in prereg coll');
                return res.send('student email');
            }
            Prereg.findOne({ parentEmail: email })
            .then(userDoc => {
                if (userDoc){
                  console.log('parent email is in use in prereg coll');
                  return res.send('parent email');
                  //create user here
                }     
                return bcrypt.hash(password, 12)
                .then(hashedPassword => {//once done hashing, 
                    const user = new User({//new user object
                        firstName: req.body.firstName,
                        middleName: req.body.middleName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        phoneNum: req.body.phoneNum,
                        password: hashedPassword,
                        role: req.body.role,
                        active: 1
                    });
                    console.log('account successfully created!');
                    return user.save();//saving user object to database
                })
                .then(result => {
                    res.send('<h1>account created!</h1>');
                });
            })
            .catch(err => {
                console.log(err);
            }); 
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log(err);
    }); 
});

router.put('/admin/:id', isAuth, isAdmin, (req, res) => {

});

//archive user

module.exports = router;