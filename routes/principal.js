const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 
const client = require('twilio')(accountSid, authToken); 

const User = require('../models/user');
const Prereg = require('../models/prereg');
const Annc = require('../models/annc');
const Section = require('../models/section');
const Grade = require('../models/grade');
const Subject = require('../models/subject');
const Studentinfo = require('../models/studentinfo');

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

                    let dept = req.body.department.trim().toLowerCase();

                    const user = new User({//new user object
                        firstName: capitalizeFirstLetters(req.body.firstName),
                        middleName: capitalizeFirstLetter(req.body.middleName),
                        lastName: capitalizeFirstLetter(req.body.lastName),
                        email: req.body.email.toLowerCase(),
                        phoneNum: req.body.phoneNum,
                        department: capitalizeFirstLetter(dept),
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

        let departments = [];
        for (user in users) {
            if (!departments.includes(users[user].department)){
                departments.push(users[user].department)
            }
        }
        console.log(departments)
        res.json({
            success: true,
            users: users,
            departments: departments,
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

//gets list of teacher names and email
router.get('/principal/teacherList', isAuth, isPrincipal, async (req, res) => {
    try {
        const page = req.query.page;
        let users = await User.find({ $and:[{role: 4}, {active: true}] });//only finds active users with roles 4
        let teachers = [];
        for (user in users){
            let fullname = users[user].lastName + ", " + users[user].firstName;
            let teacher = {
                email: users[user].email,
                name: fullname
            }
            teachers.push(teacher);
        }
        res.json({
            success: true,
            teachers: teachers
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
            phoneNum: req.body.phoneNum,
            department: req.body.department }},
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
        let teachers = await User.find({$and: [{ role: 4 }, { active: true }]});
        let students = await User.find({$and: [{ role: 6 }, { active: true }]});
        for (student in students) {
            let parent = await User.findOne({ student_id: students[student]._id });
            userEmails.push(students[student].email);
            userEmails.push(parent.email);
        }
        for (teacher in teachers) {
            userEmails.push(teachers[teacher].email);
        }

        console.log(userEmails);

        const oauth2Client = new OAuth2(
            process.env.CLIENT_ID, // ClientID
            process.env.CLIENT_SECRET, // Client Secret
            "https://developers.google.com/oauthplayground" // Redirect URL
        );
            
        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN
        });
        const accessToken = oauth2Client.getAccessToken()

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SRV,
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken
            },
            tls: {
                rejectUnauthorized: false
              }
        });
        
        //send email
        var announcementEmail = {
            from: process.env.EMAIL,
            bcc: userEmails,
            subject: "TMIS announcement!",
            html: "A new announcement has been posted! you may view it by visiting our website "+'<a href="' + process.env.WEBSITE  +'">here</a>' + "."
        };
        transporter.sendMail(announcementEmail);
        }

        if (req.body.asSMS){
        //get all phone nums of active students then get parents
        let userPhoneNums = [];
        let teachers = await User.find({$and: [{ role: 4 }, { active: true }]});
        let students = await User.find({$and: [{ role: 6 }, { active: true }]});
        for (student in students) {
            let parent = await Studentinfo.findOne({ student: students[student]._id });
            userPhoneNums.push(students[student].phoneNum);
            userPhoneNums.push(parent.parentPhoneNum);
        }
        for (teacher in teachers) {
            userPhoneNums.push(teachers[teacher].phoneNum);
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

        let teachers = []
        // check teacher email if exists in database
        for (var i = 0, l = req.body.teachers.length; i < l; i++){
            try {
            var teacher = req.body.teachers[i];
            let user = await User.findOne({email: teacher.toLowerCase()});
            if (!user) {
                console.log(req.body.teachers[i] +" doesnt exist");
                return res.send(req.body.teachers[i] +" doesnt exist at index: "+i);
            }
            let teach = req.body.teachers[i].toLowerCase();
            teachers.push(teach);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        }

        console.log(req.body.schoolYearFrom);
        console.log(req.body.schoolYearTo);
        console.log(req.body.yearLevel);
        console.log(req.body.strand);
        console.log(req.body.semester);
        console.log(req.body.sectionName);
        console.log(req.body.subjects);
        console.log(teachers);
        console.log(req.body.schedule);

        let subjs = req.body.subjects;
        let secSubjects = []
        for (subj in subjs){
            let s = subjs[subj];
            s.trim();
            secSubjects.push(s);
        }

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
    
            subjects: secSubjects, //all three must be same length
            schedule: req.body.schedule,
            teachers: teachers, // emails
        
            active: true
        });
        await section.save();
        console.log(section);

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
router.post('/principal/sectionsStud/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        //make sure req.body.students is an ARRAY

        // check student numbers if exists in database
        // studentsInput = [];
        // for (student in req.body.students) {
        //     studentsInput.push(req.body.students[student]);
        // }
        // console.log(studentsInput);
        console.log(req.body.students.length);

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
        for (var i = 0, l = req.body.students.length; i < l; i++){
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
                q4Grades: blankGrades,
                computedGrades: blankGrades,
                finalGrades: blankGrades,
                remarks: blankGrades
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

//get students in section (baka di need since nandun naman na yung names ng students)
// router.get('/principal/sections/:id/students', isAuth, isPrincipal, async (req, res) => {
//     try {
//         let users = await User.find( {$and:[{role: 6}, {active: true},]} )
//         res.json({
//             success: true,
//             users: users,
//         });
//     } 
//     catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// });

//get students in yearLevel
router.get('/principal/sectionAdd/:id/:yearLevel', isAuth, isPrincipal, async (req, res) => {
    try {
        let section = await Section.findOne( {_id: req.params.id} )
        let users = await User.find( {$and:[{role: 6}, {active: true}, {yearLevel: req.params.yearLevel}]} )
        // let userCount = await User.find( {$and:[{role: 6}, {active: true}, {yearLevel: req.params.yearLevel}]} ).count()
        let sectionStudents = section.studentLRNs;
        let freshUsers = []

        for (user in users) {
            if (!sectionStudents.includes(users[user].LRNNo)) {
                freshUsers.push(users[user])
            }
        }

        res.json({
            success: true,
            users: freshUsers,
            // userCount: userCount
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
        console.log(section)
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

//SUBJECTS

//get all subject lists
router.get('/principal/levels', isAuth, isPrincipal, async (req, res) => {
    try {
        let subjectsList = await Subject.find();
        res.json({
            success: true,
            subjectsList: subjectsList
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


//open specific subject list
router.get('/principal/subjects/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let subjects = await Subject.findOne( {_id: req.params.id} );
        res.json({
            success: true,
            subjects: subjects
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//edit subjects list 
router.put('/principal/editSubj/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let subjs = req.body.subjects;
        let s = []
        for (i in subjs){
            let item = subjs[i];
            item.trim();
            s.push(item);
        }
        let subjects = await Subject.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { 
                subjects: s }},
            { new: true });
        res.json({
            success: true,
            subjects: subjects
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//delete subjects list
router.delete('/principal/delSubj/:id', isAuth, isPrincipal, async (req, res) => {
    try {
        let subjects = await Subject.findOneAndDelete( {_id: req.params.id} );
        res.json({
            success: true,
            subjects: subjects
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//add new subject list
router.post('/principal/newSubj', isAuth, isPrincipal, async (req, res) => {
    try {
        let search = await Subject.findOne( {$and: [{ gradeLevel: req.body.gradeLevel }, { strand: req.body.strand.toUpperCase() }, { semester: req.body.semester }]})
        console.log(search)
        if (!search == null){
            console.log("already exists")
            return res.send("already exists")
        }
        let subjects = []
        let subject = new Subject({
            gradeLevel: req.body.gradeLevel,
            strand: req.body.strand.trim().toUpperCase(),
            semester: req.body.semester,
            subjects: subjects
        });
        await subject.save();
        res.json({
            success: true,
            search: search,
            subject: subject
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//SECTION CREATION DROPDOWNS
router.get('/principal/subjectsData', isAuth, isPrincipal, async (req, res) => {
    try {
        let g7 = await Subject.findOne( {gradeLevel: 7} );
        let g8 = await Subject.findOne( {gradeLevel: 8} );
        let g9 = await Subject.findOne( {gradeLevel: 9} );
        let g10 = await Subject.findOne( {gradeLevel: 10} );
        let g11 = await Subject.find( {gradeLevel: 11} );
        let g12 = await Subject.find( {gradeLevel: 12} );

        let grade7 = g7.subjects;
        let grade8 = g8.subjects;
        let grade9 = g9.subjects;
        let grade10 = g10.subjects;
        let g11strands = [];
        let g12strands = [];
        for (i in g11){
            if (!g11strands.includes(g11[i].strand)){
                g11strands.push(g11[i].strand);
            }
        }
        for (i in g12){
            if (!g12strands.includes(g12[i].strand)){
                g12strands.push(g12[i].strand);
            }
        }
        let grade11 = [];
        let grade12 = [];
        for (i in g11strands){
            let g11sem1 = await Subject.findOne( {$and: [{ gradeLevel: 11 }, { strand: g11strands[i] }, { semester: "1st" }]} )
            let g11sem2 = await Subject.findOne( {$and: [{ gradeLevel: 11 }, { strand: g11strands[i] }, { semester: "2nd" }]} )
            let sem1g11 = []
            let sem2g11 = []
            if (!g11sem1 == null){
                sem1g11 = g11sem1.subjects
            }
            if (!g11sem2 == null){
                sem2g11 = g11sem2.subjects
            }
            let strand = {
                strand: g11strands[i],
                sem1subjects: sem1g11,
                sem2subjects: sem2g11
            }
            grade11.push(strand);
        }
        for (i in g12strands){
            let g12sem1 = await Subject.findOne( {$and: [{ gradeLevel: 12 }, { strand: g12strands[i] }, { semester: "1st" }]} )
            let g12sem2 = await Subject.findOne( {$and: [{ gradeLevel: 12 }, { strand: g12strands[i] }, { semester: "2nd" }]} )
            let sem1g12 = []
            let sem2g12 = []
            if (!g12sem1 == null){
                sem1g12 = g12sem1.subjects
            }
            if (!g12sem2 == null){
                sem2g12 = g12sem2.subjects
            }
            let strand = {
                strand: g12strands[i],
                sem1subjects: sem1g12,
                sem2subjects: sem2g12
            }
            grade11.push(strand);
        }
        res.json({
            success: true,
            g7: grade7,
            g8: grade8,
            g9: grade9,
            g10: grade10,
            g11: grade11,
            g11strands: g11strands,
            g12: grade12,
            g12strands: g12strands
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


//get user counts
router.get('/principal/userCount', isAuth, isPrincipal, async (req, res) => {
    try {
        //all users
        let totalUsers = await User.find().count();
        let totalAdmins = await User.find( { role: 0 } ).count();
        let totalPrincipals = await User.find( { role: 1 } ).count();
        let totalAccountants = await User.find( { role: 2 } ).count();
        let totalRegistrars = await User.find( { role: 3 } ).count();
        let totalTeachers = await User.find( { role: 4 } ).count();
        //let totalParents = await User.find( { role: 5 } ).count();
        let totalStudents = await User.find( { role: 6 } ).count();
        
        let totalSections = await Section.find().count(); //all sections


        //active users
        let activeUsers = await User.find( {active: true }).count();
        let activeAdmins = await User.find({$and: [{ role: 0 }, { active: true }]}).count();
        let activePrincipals = await User.find({$and: [{ role: 1 }, { active: true }]}).count();
        let activeAccountants = await User.find({$and: [{ role: 2 }, { active: true }]}).count();
        let activeRegistrars = await User.find({$and: [{ role: 3 }, { active: true }]}).count();
        let activeTeachers = await User.find({$and: [{ role: 4 }, { active: true }]}).count();
        //let activeParents = await User.find({$and: [{ role: 5 }, { active: true }]}).count();
        let activeStudents = await User.find({$and: [{ role: 6 }, { active: true }]}).count();
        
        let activeSections = await Section.find( { active: true } ).count(); //active sections

    
        //percentages active
        let percentUsersActive = (activeUsers/totalUsers)*100;
        let percentStudentsActive = (activeStudents/totalStudents)*100; 
        let percentTeachersActive = (activeTeachers/totalTeachers)*100;


        res.json({
            success: true
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