const crypto = require('crypto');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const Prereg = require('../models/prereg');
const User = require('../models/user');

//home page / announcements
router.get('/', (req, res) => {
    res.send('hello world')
});

//test lang delete later
// router.get('/email', (req, res) => {
// const mailgun = require("mailgun-js");
// const APIKEY = '78f310b811677d45428024a109a80a04-9ad3eb61-01d06eae';
// const DOMAIN = 'sandboxc0239df2a35b4fa6963da4e16a8ee67e.mailgun.org';
// const mg = mailgun({apiKey: APIKEY, domain: DOMAIN});
// const data = {
// 	from: 'Excited User <me@samples.mailgun.org>',
// 	to: 'falquezamiguel@gmail.com',
// 	subject: 'Hello',
// 	text: 'Testing some Mailgun awesomness!'
// };
// mg.messages().send(data, function (error, body) {
// 	console.log(body);
// });
// });

//login form / implement JWT
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
                    const token = jwt.sign({ _id: user._id, email: user.email, phoneNum: user.phoneNum, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h'}); //probably keep _id, email, and role in jwt
                    return res.status(200).json({ token: token }); // Authorization: Bearer <TOKEN> << set as header in front end
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

//resetting of password
router.post('/reset/:token', (req, res) => {
    
    const token = req.params.token;//takes token from url
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
            return res.send('email is in use!');
        }
        Prereg.findOne({ email: email })
        .then(userDoc => {
            if (userDoc){
                console.log('student email exists as student in prereg')
                return res.send('email is in use!')
            }
            Prereg.findOne({ parentEmail: email })
            .then(userDoc => {
                if (userDoc){
                    console.log('student email exists as parent in prereg')
                    return res.send('email is in use!')
                }
                User.findOne({ email: parentEmail })//checks if parent email in form already exists in user and prereg collection
                .then(userDoc => {
                    if (userDoc){
                        console.log('parent email exists in users')
                        return res.send('email is in use!')
                    }
                    Prereg.findOne({ email: parentEmail })
                    .then(userDoc => {
                        if (userDoc){
                            console.log('parent email exists as student in prereg')
                            return res.send('email is in use!')
                        }
                        Prereg.findOne({ parentEmail: parentEmail })
                        .then(userDoc => {
                            if (userDoc){
                                console.log('parent email exists as parent in prereg')
                                return res.send('email is in use!')
                            }
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