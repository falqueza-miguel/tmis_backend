const crypto = require('crypto');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SRV,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PW
    }
});

const Prereg = require('../models/prereg');
const User = require('../models/user');
const Annc = require('../models/annc');
const user = require('../models/user');

//home page / announcements
router.get('/', async (req, res) => {
    try {
        let anncs = await Annc.find().sort({ createdAt: -1 }).limit(5);
        res.json({
            success: true,
            anncs: anncs
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//login form 
router.post('/', body('email').isEmail(), (req, res) => {

    const errors = validationResult(req); //validates if email is an actual email
    if (!errors.isEmpty()){
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    const email = req.body.email;//inputs
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
                    console.log('correct password logging you in!');
                    const token = jwt.sign(
                        { _id: user._id, 
                        email: user.email, // email might not be used
                        role: user.role 
                        }, process.env.JWT_SECRET, { expiresIn: '1d'}); //expires in 1 day, easy code yes
                    res.cookie('token', token, {maxAge: 24 * 60 * 60 * 1000, httpOnly: true }); //maxAge is in miliseconds???? why???? pero ayan 1 day
                    return res.status(200).json({token: token, role: user.role}); // Authorization: Bearer <TOKEN> << set as header in front end
                    
                    //if password is correct, next probably see what role and redirect to new route
                    //next step here

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
router.post('/forgotpassword', body('email').isEmail(), (req, res) => {
    
    const errors = validationResult(req); //validates if email is an actual email
    if (!errors.isEmpty()){
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }    
    
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
                console.log(result);//user object successfully has reset token and exp in database

                const resetPasswordEmail = {
                    from: process.env.EMAIL,
                    to: user.email,
                    subject: "TMIS reset password",
                    html: "<h1>go to this link to reset your password /reset/</h1>" + token + process.env.EMAIL + process.env.EMAIL_PW
                };

                transporter.sendMail(resetPasswordEmail).then(result => {
                    res.send('email and token sent!');
                })
                .catch(err => {
                    console.log(err);
                });
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

//resetting of password
router.post('/reset/:token', (req, res) => {
    
    const token = req.body.token;//takes token from body
    const newPassword = req.body.password;
    const confirmNewPassword = req.body.confirmPassword;

    let resetUser;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})//finds user with token and checks if in time
    .then(user => {
        if (newPassword !== confirmNewPassword){
            console.log('passwords are not the same');
            return res.send('passwords are not the same');
        }
        resetUser = user;//puts user object into var for later thenfuncs
        return bcrypt.hash(newPassword, 12)    
        .then(hashedPassword =>{
            resetUser.password = hashedPassword;//puts new password in user obj
            resetUser.resetToken = undefined;//clears token and exp in user obj
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();//updates obj in database
        })
        .then(result => {
            console.log(result);//final updated user obj here
            console.log('password reset!');
            res.send('password reset!'); //redirect to login probably
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log('no user found or passwords are not the same!');
        console.log(err);
    });
})


//prereg page / link in home page
router.get('/prereg', (req, res) => {
    res.send('<form action="/prereg" method="POST"><button type="submit"></form>')
});

//submit prereg (check if emails are valid and unique(?))
router.post('/prereg', body('email').isEmail(), body('parentEmail').isEmail(), (req, res) => {

    const errors = validationResult(req); //validates if emails are actual emails
    if (!errors.isEmpty()){
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    
    if (req.body.email == req.body.parentEmail){ //checks if both are different emails
        console.log('cannot use same email for 2 fields');
        return res.send('cannot use same email for 2 fields')
    }

    const email = req.body.email;
    const parentEmail = req.body.parentEmail;

    User.findOne({ email: email })//checks if student email in form already exists in user and prereg collection
    .then(userDoc => {
        if (userDoc){
            console.log('student email exists in users');
            return res.send('student email exists!');
        }
        Prereg.findOne({ email: email })
        .then(userDoc => {
            if (userDoc){
                console.log('student email exists as student in prereg')
                return res.send('student email exists!')
            }
            Prereg.findOne({ parentEmail: email })
            .then(userDoc => {
                if (userDoc){
                    console.log('student email exists as parent in prereg')
                    return res.send('student email exists!')
                }
                User.findOne({ email: parentEmail })//checks if parent email in form already exists in user and prereg collection
                .then(userDoc => {
                    if (userDoc){
                        console.log('parent email exists in users')
                        return res.send('parent email exists!')
                    }
                    Prereg.findOne({ email: parentEmail })
                    .then(userDoc => {
                        if (userDoc){
                            console.log('parent email exists as student in prereg')
                            return res.send('parent email exists!')
                        }
                        Prereg.findOne({ parentEmail: parentEmail })
                        .then(userDoc => {
                            if (userDoc){
                                console.log('parent email exists as parent in prereg')
                                return res.send('parent email exists!')
                            }
                            const prereg = new Prereg({
                                schoolYearFrom: req.body.schoolYearFrom,
                                schoolYearTo: req.body.schoolYearTo,
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
                            .catch(err => {
                                console.log(err);
                            })
                        })
                        .catch(err => {
                            console.log(err);
                        })
                    })
                    .catch(err => {
                        console.log(err);
                    })
                })
                .catch(err => {
                    console.log(err);
                })
            })
            .catch(err => {
                console.log(err);
            })
        })
        .catch(err => {
            console.log(err);
        })
    })
    .catch(err => {
        console.log(err);
    });
});

module.exports = router;