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
                return res.send('no user found');//response if no user found
            }
            bcrypt.compare(password, user.password)//checks if hashed password is same as stored in database
            .then(result => {
                if (result) {
                    return res.send('correct password!');//if passwords match
                }
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
        res.send('<h1>prereg created!</h1>'); // this will be what is sent to the user, json file siguro
    })
    .catch(err => {
        console.log(err);
    })
});

module.exports = router;