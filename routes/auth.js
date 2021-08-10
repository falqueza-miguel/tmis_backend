const crypto = require('crypto');
const router = require('express').Router();
const bcrypt = require('bcryptjs');

const Prereg = require('../models/prereg');
const User = require('../models/user');

//home page / announcements
router.get('/', (req, res) => {
    res.send('hello world')
});

//login form / implement JWT
router.post('/', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})//searches for user in database
        .then(user => {
            if (!user){//no user found
                console.log('user doesnt exist');
                return res.send('no user found');//response if no user found
            }
            bcrypt.compare(password, user.password)//checks if hashed password is same as stored in database
            .then(result => {
                if (result) {
                    console.log('correct password logging you in!')
                    return res.send('correct password!');//if password is correct, next probably see what role
                }
                console.log('incorrect password!');
                res.send('incorrect password!');//if passwords dont match
            })
            .catch(err => {
                console.log(err);
            });
        })
        .catch(err => {
            console.log(err);
        });
});

//reset password page / di ko sure if need?
router.get('/forgotpassword', (req, res) => {
    res.send('reset password page')
});

//submit email for reset password
router.post('/forgotpassword', (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {//creating reset token
        if (err){
            console.log(err);
            return res.send('error creating token');//if we get an error
        }
        console.log('token created!');
        var token = buffer.toString('hex');//token created
        User.findOne({email: req.body.email})
        .then(user => {
            if(!user){
                console.log('no user found!');
                console.log(token);
                token = undefined;
                console.log('token destroyed');
                console.log(token);
                return res.send('no user found!');//if no email found 
            }
            user.resetToken = token; //token being saved in database
            user.resetTokenExpiration = Date.now() + 3600000; //1 hour from now
            return user.save().then(result => {
                console.log(result);//user object successfully updated
                //send email here
                //link to reset = /reset/{token}here
                res.send('email and token sent!');//redirect to homepage probably
            }); //updates user in database
        })
        .catch(err, user => {
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            console.log(err);
        });
    });
});

//need pa ba get request for '/reset/:token'?

//resetting of password, link clicked (NOT SURE YET)
router.post('/reset/:token', (req, res) => {
    const token = req.params.token;//takes token from url
    const newPassword = req.body.password;
    let resetUser;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})//finds user with token and checks if in time
    .then(user => {
        resetUser = user;//puts user object into var for later thenfuncs
        return bcrypt.hash(newPassword, 12); //hashes new password
    })
    .then(hashedPassword =>{
        resetUser.password = hashedPassword;//puts new password in user obj
        resetUser.resetToken = undefined;//clears token and exp in user obj
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();//updates obj in database
    })
    .then(result => {
        console.log(result);//final updated user obj here
        console.log('password reset!')
        res.send('password reset!'); //redirect to login probably
    })
    .catch(err => {
        console.log(err);
    });
})



//prereg page / link in home page
router.get('/prereg', (req, res) => {
    res.send('<form action="/prereg" method="POST"><button type="submit"></form>')
});

//submit prereg (check if emails are valid and unique(?))
router.post('/prereg', (req, res) => {
    const prereg = new Prereg({
        schoolYear: req.body.schoolYear,
        levelEnroll: req.body.levelEnroll,
        hasLRN: req.body.hasLRN,
        returning: req.body.returning,
    
        //student
        PSANo: req.body.PSANo,
        LRNNo: req.body.LRNNo,
        studentFirstName: req.body.studentFirstName,
        studentMiddleName: req.body.studentMiddleName,
        studentLastName: req.body.studentLastName,
        birthDate: req.body.birthDate,
        gender: req.body.gender,
        indig: req.body.indig,
        indigSpec: req.body.indigSpec,
        motherTongue: req.body.motherTongue,
        address1: req.body.address1,
        address2: req.body.address2,
        zipCode: req.body.zipCode,
        email: req.body.email,
        phoneNum: req.body.phoneNum,
    
        //parent/guardian
        motherFirstName: req.body.motherFirstName,
        motherMiddleName: req.body.motherMiddleName,
        motherLastName: req.body.motherLastName,
        fatherFirstName: req.body.fatherFirstName,
        fatherMiddleName: req.body.fatherMiddleName,
        fatherLastName: req.body.fatherLastName,
        guardianFirstName: req.body.guardianFirstName,
        guardianMiddleName: req.body.guardianMiddleName,
        guardianLastName: req.body.guardianLastName,
        parentEmail: req.body.parentEmail,
        parentPhoneNum: req.body.parentPhoneNum,
    
        //for returning students
        lastGradeLevel: req.body.lastGradeLevel,
        lastSchoolYear: req.body.lastSchoolYear,
        schoolName: req.body.schoolName,
        schoolAddress: req.body.schoolAddress,
    
        //for shs students
        semester: req.body.semester,
        track: req.body.track,
        strand: req.body.strand, 
    
        //prefered learning modes
        modularP: req.body.modularP,
        modularD: req.body.modularD,
        online: req.body.online,
        educTV: req.body.educTV,
        radioBased: req.body.radioBased,
        homeschool: req.body.homeschool,
        blended: req.body.blended,
        facetoface: req.body.facetoface
    
    });
    prereg.save()
    .then(result => {
        console.log('prereg created, database connection successful, check mongo atlas');
        res.send('prereg created!'); // this will be what is sent to the user, json file siguro
    })
    .catch(err => {//duplicate key error if both
        console.log(err);
    })
});

module.exports = router;