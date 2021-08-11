const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const User = require('../models/user');
const Prereg = require('../models/prereg');

//deal with default passwords later, could use birthdate for students and parents only
router.post('/admin/createuser', body('email').isEmail(), (req, res) => {

    //add check if logged in and check if admin

    const errors = validationResult(req); //validates if email is an actual email
    if (!errors.isEmpty()){
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    const email = req.body.email;
    const password = 'password';//default password here

    Prereg.findOne({ email: email })//checks if email used already exists in prereg too
    .then(userDoc => {
        if (userDoc){
            console.log('email is in use! 2')
            return res.send('email is in use! 2');
        }
    })
    .catch(err => {
        console.log(err);
    });
    Prereg.findOne({ parentEmail: email })
    .then(userDoc => {
        if (userDoc){
            console.log('email is in use! 3')
            return res.send('email is in use! 3')
        }
    })
    .catch(err => {
        console.log(err);
    });

    User.findOne({ email: email })
    .then(userDoc => {//authentication and creation
        if (userDoc){//checks if already exists, could be redundant code(?)
            console.log('user already exists')
            return res.redirect('/');//user already exists, redirects to home page for now
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
});

module.exports = router;