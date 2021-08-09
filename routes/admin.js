const router = require('express').Router();
const bcrypt = require('bcryptjs');

const User = require('../models/user');

//deal with default passwords later, could use birthdate for students and parents only
router.post('/admin/createuser', (req, res) => {

    //add check if logged in and check if admin

    const firstName = req.body.firstName;
    const middleName = req.body.middleName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const phoneNum = req.body.phoneNum;
    const password = 'password';//default password here
    const role = req.body.role;
    User.findOne({ email: email})
    .then(userDoc => {//authentication and creation
        if (userDoc){//checks if already exists, could be redundant code(?)
            console.log('user already exists')
            return res.redirect('/');//user already exists, redirects to home page for now
        }
        return bcrypt.hash(password, 12)
        .then(hashedPassword => {//once done hashing, 
            const user = new User({//new user object
                firstName: firstName,
                middleName: middleName,
                lastName: lastName,
                email: email,
                phoneNum: phoneNum,
                password: hashedPassword,
                role: role,
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