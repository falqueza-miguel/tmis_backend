const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 
const client = require('twilio')(accountSid, authToken); 

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
const USERS_PER_PAGE = 1000;
const SECTIONS_PER_PAGE = 1000;
const ANNC_PER_PAGE = 1000;


//user profile page
router.get('/principal', isAuth, isPrincipal, async (req, res) => {
    try {
        let user = await User.findOne({ _id: res.locals._id });
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

                    let capitalizeFirstLetter = (string) => {
                        return string.charAt(0).toUpperCase() + string.slice(1);
                    }

                    let capitalizeFirstLetters = (str) => {
                        var splitStr = str.toLowerCase().split(' ');
                        for (var i = 0; i < splitStr.length; i++) {
                            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
                        }
                        return splitStr.join(' '); 
                    }

                    const user = new User({//new user object
                        firstName: capitalizeFirstLetters(req.body.firstName),
                        middleName: capitalizeFirstLetter(req.body.middleName),
                        lastName: capitalizeFirstLetter(req.body.lastName),
                        email: req.body.email.toLowerCase(),
                        phoneNum: req.body.phoneNum,
                        department: req.body.department,
                        password: hashedPassword,
                        role: 4,
                        active: true,
                        firstLogin: true
                    });

                    console.log('account successfully created!');
                    newUser = user
                    return user.save();//saving user object to database
                })
                .then(result => {
                    res.json({
                        success: true,
                        user: newUser
                    });
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
        const page = req.query.page;
        let totalUsers = await User.find({ $and:[{role: 4}, {active: true}] }).count();
        let users = await User.find({ $and:[{role: 4}, {active: true}] }).skip((page-1)*USERS_PER_PAGE).limit(USERS_PER_PAGE);//only finds active users with roles 4
        res.json({
            success: true,
            users: users,
            totalUsers: totalUsers,
            hasNextPage: USERS_PER_PAGE * page < totalUsers,
            hasPreviousPage: page > 1,
            nextPage: parseInt(page) + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalUsers/USERS_PER_PAGE)
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

        if (req.body.asEmail){
        //get all emails of active students then get parents
        let userEmails = [];
        let students = await User.find({$and: [{ role: 6 }, { active: true }]});
        for (student in students) {
            let parent = await User.findOne({ student_id: students[student]._id });
            userEmails.push(students[student].email);
            userEmails.push(parent.email);
        }

        console.log(userEmails);

        //send email
        var announcementEmail = {
            from: process.env.EMAIL,
            bcc: userEmails,
            subject: "TMIS announcement!",
            html: "<h1>announcement!</h1>" // announcement goes here
        };
        transporter.sendMail(announcementEmail);
        }

        if (req.body.asSMS){
        //get all phone nums of active students then get parents
        let userPhoneNums = [];
        let students = await User.find({$and: [{ role: 6 }, { active: true }]});
        for (student in students) {
            let parent = await User.findOne({ student_id: students[student]._id });
            userPhoneNums.push(students[student].phoneNum);
            userPhoneNums.push(parent.phoneNum);
        }

        console.log(userPhoneNums);

        //send SMS
        for (num in userPhoneNums) {
        client.messages 
        .create({ 
            body: 'Tierra Monte Integrated School notification. a new announcement titled: ' + annc.title + ' has been made. Please check <link here> for more information',  // announcement goes here
            messagingServiceSid: process.env.TWILIO_SERV_SID,      
            to: '+63' + userPhoneNums[num]
        }) 
        .then(message => console.log(message.sid))
        .catch(err => {
            console.log(err);
        });
        }
        }

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
        const page = req.query.page;
        let totalAnncs = await Annc.find().count();
        let anncs = await Annc.find().sort({ createdAt: -1}).skip((page-1)*ANNC_PER_PAGE).limit(ANNC_PER_PAGE);
        res.json({
            success: true,
            anncs: anncs,
            totalAnncs: totalAnncs,
            hasNextPage: ANNC_PER_PAGE * page < totalAnncs,
            hasPreviousPage: page > 1,
            nextPage: parseInt(page) + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalAnncs/ANNC_PER_PAGE)
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
        // for (var i = 0, l = req.body.students.length; i < l; i++){
        //     try {
        //     var student = req.body.students[i];
        //     let user = await User.findOne({LRNNo: student});
        //     if (!user) {
        //         console.log(req.body.students[i] +" doesnt exist");
        //         return res.send(req.body.students[i] +" doesnt exist");
        //     }
        //     }
        //     catch (error) {
        //         res.status(500).json({
        //             success: false,
        //             message: error.message
        //         });
        //     }
        // }

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
        // cross link student LRNs to last names and arrange accordingly

        // let alphabetizedStudentLRNs = [];
        // let alphabetizedStudentNames = [];
        // let unorganizedStudentNames = [];
        // // get array of student names
        // for (student in req.body.students) {
        //     try {
        //         let user = await User.findOne({LRNNo: req.body.students[student]});
        //         let fullName = user.lastName + ", " + user.firstName + " " + user.middleName + " " + user.LRNNo;
        //         unorganizedStudentNames.push(fullName);
        //     }
        //     catch (error) {
        //         res.status(500).json({
        //             success: false,
        //             message: error.message
        //         });                
        //     }
        // }

        // unorganizedStudentNames.sort(); // sort student names with LRNs alphabetically by last name

        // for (student in unorganizedStudentNames){ // slices student LRNs from names
        //     try {
        //         let name = unorganizedStudentNames[student];
        //         let studName = name.slice(0, name.length - 12)
        //         let studLRN = name.slice(name.length - 12);
        //         alphabetizedStudentNames.push(studName.trim());
        //         alphabetizedStudentLRNs.push(studLRN.trim());
        //     }
        //     catch (error) {
        //         res.status(500).json({
        //             success: false,
        //             message: error.message
        //         });                  
        //     }
        // }

        // SECTION CREATION
        let section = new Section({ 
            schoolYearFrom: req.body.schoolYearFrom,
            schoolYearTo: req.body.schoolYearTo,
            yearLevel: req.body.yearLevel,
            strand: req.body.strand,
            semester: req.body.semester,
            sectionName: req.body.sectionName,

            // studentLRNs: alphabetizedStudentLRNs,
            // studentNames: alphabetizedStudentNames,
    
            subjects: req.body.subjects, //all three must be same length
            schedule: req.body.schedule,
            teachers: req.body.teachers, // emails
        
            active: true
        });
        await section.save();

        // //NA placeholder for grades
        // let blankGrades = [];
        // for (subject in section.subjects) {
        //     let blank = "";
        //     blankGrades.push(blank);
        // }

        // //create grades object for each student in section object
        // for (var i = 0, l = section.studentLRNs.length; i < l; i++) {
        //     var studentLRN = section.studentLRNs[i];
        //     let grade = new Grade({
        //         studentLRN: studentLRN,
        //         sectionID: section._id,

        //         schoolYearFrom: section.schoolYearFrom,
        //         schoolYearTo: section.schoolYearTo, // reference section schoolyear
        //         yearLevel: section.yearLevel, // reference section yearlevel
        //         semester: section.semester,
        //         strand: section.strand,
        //         sectionName: section.sectionName, // reference section sectionname

        //         subjects: section.subjects,
        //         teachers: section.teachers,
        //         q1Grades: blankGrades,
        //         q2Grades: blankGrades,
        //         q3Grades: blankGrades,
        //         q4Grades: blankGrades  
        //     });
        //     console.log("created grade for " + studentLRN);
        //     await grade.save();
        // }
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

//add students to section
router.post('/principal/sections/:id/addStudents', isAuth, isPrincipal, async (req, res) => {
    try {
        //make sure req.body.students is an ARRAY

        // check student numbers if exists in database
        // studentsInput = [];
        // for (student in req.body.students) {
        //     studentsInput.push(req.body.students[student]);
        // }
        // console.log(studentsInput);

        for (var i = 0, l = req.body.students.length; i < l; i++){
            try {
            var studentTest = req.body.students[i];
            let user = await User.findOne({LRNNo: studentTest});
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

        //check if student already exists in section
        for (var i = 0, l = testData.length; i < l; i++){
            try {
            var studentTest = req.body.students[i];
            let sectionTest = await Section.findOne( {_id: req.params.id} );
            if (sectionTest.studentLRNs.includes(studentTest)) {
                console.log(req.body.students[i] +" is already in this section");
                return res.send(req.body.students[i] +" is already in this section");
            }   
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        }

        // get array of student names
        let studentFullNames = [];
        for (student in req.body.students) {
            try {
                let user = await User.findOne({LRNNo: req.body.students[student]});
                let fullName = user.lastName + ", " + user.firstName + " " + user.middleName + " " + user.LRNNo;
                studentFullNames.push(fullName);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });                
            }
        }

        let studentNames = [];
        let studentLRNs = [];
        for (student in studentFullNames){ // slices student LRNs from names
            try {
                let name = studentFullNames[student];
                let studName = name.slice(0, name.length - 12)
                let studLRN = name.slice(name.length - 12);
                studentNames.push(studName.trim());
                studentLRNs.push(studLRN.trim());
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });                  
            }
        }

        //get old students add new students
        let sect = await Section.findOne( {_id: req.params.id} );
        let oStudentLRNs = sect.studentLRNs;
        let oStudentNames = sect.studentNames;
        let nStudentLRNs = oStudentLRNs.concat(studentLRNs);
        let nStudentNames = oStudentNames.concat(studentNames);

        //add them to section
        let section = await Section.findOneAndUpdate( {_id: req.params.id},
            { $set: {
                studentLRNs: nStudentLRNs,
                studentNames: nStudentNames,
            },
        },
        { new: true }
        );

        //create grades objects only for new students
        let blankGrades = []; //NA placeholder for grades
        for (subject in section.subjects) {
            let blank = "";
            blankGrades.push(blank);
        }

        //create grades object for each student in section object
        for (var i = 0, l = studentLRNs.length; i < l; i++) {
            var studentLRN = studentLRNs[i];
            let grade = new Grade({
                studentLRN: studentLRN,
                sectionID: sect._id,

                schoolYearFrom: sect.schoolYearFrom,
                schoolYearTo: sect.schoolYearTo, // reference section schoolyear
                yearLevel: sect.yearLevel, // reference section yearlevel
                semester: sect.semester,
                strand: sect.strand,
                sectionName: sect.sectionName, // reference section sectionname

                subjects: sect.subjects,
                teachers: sect.teachers,
                q1Grades: blankGrades,
                q2Grades: blankGrades,
                q3Grades: blankGrades,
                q4Grades: blankGrades  
            });
            console.log("created grade for " + studentLRN);
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

//get students in yearLevel
router.get('/principal/sections/:yearLevel', isAuth, isPrincipal, async (req, res) => {
    try {
        let users = await User.find( {$and:[{role: 6}, {active: true}, {yearLevel: req.params.yearLevel}]} )
        res.json({
            success: true,
            users: users,
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
        const page = req.query.page;
        let totalSections = await Section.find( {active: true} ).count();
        let sections = await Section.find( {active: true} ).skip((page-1)*SECTIONS_PER_PAGE).limit(SECTIONS_PER_PAGE);
        res.json({
            success: true,
            sections: sections,
            totalSections: totalSections,
            hasNextPage: SECTIONS_PER_PAGE * page < totalSections,
            hasPreviousPage: page > 1,
            nextPage: parseInt(page) + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalSections/SECTIONS_PER_PAGE)    
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