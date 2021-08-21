const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SRV,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PW
    }
});

const User = require('../models/user');
const Prereg = require('../models/prereg');
const Annc = require('../models/annc');
const Section = require('../models/section');
const Grade = require('../models/grade');

const isAuth = require('../middleware/is-auth');
const { isPrincipal } = require('../middleware/is-role')

//MANAGE TEACHER MODULE

//create teacher
router.post('/principal/createteacher', isAuth, isPrincipal, body('email').isEmail(), (req, res) => {

    const errors = validationResult(req); //validates if email is an actual email
    if (!errors.isEmpty()){
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    const email = req.body.email;//input from frontend here
    const password = 'password';// DEFAULT PASSWORD HERE

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
                        role: 4,
                        active: true
                    });
                    console.log('account successfully created!');
                    return user.save();//saving user object to database
                })
                .then(result => {
                    res.send('<h1>account created!</h1>');//set status code here
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

//gets all active teachers
router.get('/principal/teachers', isAuth, isPrincipal, async (req, res) => {
    try {
        let users = await User.find({ $and:[{role: 4}, {active: true}] });//only finds active users with roles 4
        res.json({
            success: true,
            users: users
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get one teacher
router.get('/principal/teachers/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.params.id });
        res.json({
            success: true,
            user: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//edit one teacher
router.put('/principal/teachers/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        console.log('trying to update!');
        let user = await User.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { 
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            phoneNum: req.body.phoneNum }},
        { new: true });
        res.json({
            success: true,
            user: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//archive teacher
router.delete('/principal/archiveteacher/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let user = await User.findOneAndUpdate({ _id: req.params.id }, {active: false}, {new: true}); //fix
        res.json({
            success: true,
            user: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//MANAGE ANNOUNCEMENTS MODULE

//create announcement
router.post('/principal/createannc', isAuth, isPrincipal, async (req, res) => {
    try {
        let annc = new Annc({
            title: req.body.title,
            content: req.body.content
        });
        await annc.save();

        //get all emails of active students then get parents
        let userEmails = [];
        let students = await User.find({$and: [{ role: 6 }, { active: true }]});
        for (student in students) {
            let parent = await User.findOne({ student_id: students[student]._id });
            userEmails.push(students[student].email);
            userEmails.push(parent.email);
        }

        console.log(userEmails)

        var announcementEmail = {
            from: process.env.EMAIL,
            to: userEmails,
            subject: "TMIS announcement!",
            html: "<h1>announcement!</h1>"
        };

        transporter.sendMail(announcementEmail);

        res.json({
            success: true,
            annc: annc
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }   
});

//get all announcements
router.get('/principal/annc', isAuth, isPrincipal, async (req, res) => {
    try {
        let anncs = await Annc.find().sort({ createdAt: -1});
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

//get one announcement
router.get('/principal/annc/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let annc = await Annc.findOne({ _id: req.params.id });
        res.json({
            success: true,
            annc: annc
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

//edit announcement
router.put('/principal/annc/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        console.log('trying to update!');
        let annc = await Annc.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { 
            title: req.body.title,
            content: req.body.content }},
        { new: true });
        res.json({
            success: true,
            annc: annc
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

//delete announcement (like actually delete)
router.delete('/principal/annc/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let annc = await Annc.findOneAndDelete( {_id: req.params.id });
        res.json({
            success: true,
            annc: annc
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

//MANAGE SECTIONS MODULE

//create section, subsequently create grade object for each student
router.post('/principal/createsection', isAuth, isPrincipal, async (req, res) => {
    try{

        // check student numbers if exists in database
        for (var i = 0, l = req.body.students.length; i < l; i++){
            try {
            var student = req.body.students[i];
            let user = await User.findOne({studentNumber: student});
            if (!user) {
                console.log(req.body.students[i] +" doesnt exist");
                return res.send(req.body.students[i] +" doesnt exist");
            }
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        }

        // check teacher email if exists in database
        for (var i = 0, l = req.body.teachers.length; i < l; i++){
            try {
            var teacher = req.body.teachers[i];
            let user = await User.findOne({email: teacher});
            if (!user) {
                console.log(req.body.teachers[i] +" doesnt exist");
                return res.send(req.body.teachers[i] +" doesnt exist");
            }
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        }

        // ALPHABETIZE STUDENTS BEFORE CREATING SECTION
        // cross link student numbers to last names and arrange accordingly

        let alphabetizedStudentNumbers = [];
        let alphabetizedStudentNames = [];
        let unorganizedStudentNames = [];
        // get array of student names
        for (student in req.body.students) {
            try {
                let user = await User.findOne({studentNumber: req.body.students[student]});
                let fullName = user.lastName + ", " + user.firstName + " " + user.middleName + " " + user.studentNumber;
                unorganizedStudentNames.push(fullName);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });                
            }
        }

        unorganizedStudentNames.sort(); // sort student names with numbers alphabetically by last name

        for (student in unorganizedStudentNames){ // slices student numbers from names
            try {
                let name = unorganizedStudentNames[student];
                let studName = name.slice(0, name.length - 10)
                let studNumber = name.slice(name.length - 10);
                alphabetizedStudentNames.push(studName.trim());
                alphabetizedStudentNumbers.push(studNumber.trim());
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });                  
            }
        }

        // SECTION CREATION
        let section = new Section({ 
            schoolYearFrom: req.body.schoolYearFrom,
            schoolYearTo: req.body.schoolYearTo,
            yearLevel: req.body.yearLevel,
            strand: req.body.strand,
            semester: req.body.semester,
            sectionName: req.body.sectionName,

            studentNumbers: alphabetizedStudentNumbers,
            studentNames: alphabetizedStudentNames,
    
            subjects: req.body.subjects, //all three must be same length
            schedule: req.body.schedule,
            teachers: req.body.teachers, // emails
        
            active: true
        });
        await section.save();

        //NA placeholder for grades
        let blankGrades = [];
        for (subject in section.subjects) {
            let blank = "";
            blankGrades.push(blank);
        }

        //create grades object for each student in section object
        for (var i = 0, l = section.studentNumbers.length; i < l; i++) {
            var studentNumber = section.studentNumbers[i];
            let grade = new Grade({
                studentNumber: studentNumber,
                sectionID: section._id,

                schoolYearFrom: section.schoolYearFrom,
                schoolYearTo: section.schoolYearTo, // reference section schoolyear
                yearLevel: section.yearLevel, // reference section yearlevel
                semester: section.semester,
                strand: section.strand,
                sectionName: section.sectionName, // reference section sectionname

                subjects: section.subjects,
                teachers: section.teachers,
                q1Grades: blankGrades,
                q2Grades: blankGrades,
                q3Grades: blankGrades,
                q4Grades: blankGrades  
            });
            console.log("created grade for " + studentNumber);
            await grade.save();
        }
        res.json({
            success: true,
            section: section
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get all active sections
router.get('/principal/sections', isAuth, isPrincipal, async (req, res) => {
    try {
        let sections = await Section.find( {active: true} );
        res.json({
            success: true,
            sections: sections
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


//get one section
router.get('/principal/sections/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let section = await Section.findOne( {_id: req.params.id} );
        res.json({
            success: true,
            section: section
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



//edit / archive section
router.delete('/principal/sections/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let section = await Section.findOneAndUpdate({_id: req.params.id}, {active: false}, {new: true});
        res.json({
            success: true,
            section: section
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;