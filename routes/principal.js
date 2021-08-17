const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

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
router.post('/principal/createannc', isAuth, isPrincipal, (req, res) => {

    let annc = new Annc({
        title: req.body.title,
        content: req.body.content
    });
    annc.save()
    .then(result => {
        res.json({
            success: true,
            annc: annc
        });
    })
    .catch(error => {
        res.status(500).json({
            success: false,
            message: error.message
        });
    })
});

//get all announcements
router.get('/principal/annc', isAuth, isPrincipal, async (req, res) => {
    try {
        let anncs = await Annc.find();
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

        let section = new Section({
            schoolYearFrom: req.body.schoolYearFrom,
            schoolYearTo: req.body.schoolYearTo,
            yearLevel: req.body.yearLevel,
            sectionName: req.body.sectionName,
            students: req.body.students, // studentNumber
    
            subjects: req.body.subjects, //all three must be same length
            schedule: req.body.schedule,
            teachers: req.body.teachers, // DATABASE _id OR email
        
            active: true
        });
        await section.save();

        //create grades object for each student in section object
        for (var i = 0, l = section.students.length; i < l; i++) {
            var studentNumber = section.students[i];
            let grade = new Grade({
                studentNumber: studentNumber,
                sectionID: section._id,

                schoolYearFrom: section.schoolYearFrom,
                schoolYearTo: section.schoolYearTo, // reference section schoolyear
                yearLevel: section.yearLevel, // reference section yearlevel
                sectionName: section.sectionName, // reference section sectionname

                subjects: section.subjects,
                teachers: section.teachers
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

//edit section (best not enable this yet)(these fields are also referenced in grade, find fix)
router.put('/principal/sections/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let section = await Section.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { 
                schoolYear: req.body.schoolYear,
                yearLevel: req.body.yearLevel,
                sectionName: req.body.sectionName
            }},
            { new: true });
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

//archive section
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