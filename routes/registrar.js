const router = require('express').Router();
const bcrypt = require('bcryptjs');
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
const Counter = require('../models/counter');

const isAuth = require('../middleware/is-auth');
const { isRegistrar } = require('../middleware/is-role');
const StudentInfo = require('../models/studentinfo');
const USERS_PER_PAGE = 1000;
const PREREGS_PER_PAGE = 1000;

//user profile page
router.get('/registrar', isAuth, isRegistrar, async (req, res) => {
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

//get all preregs
router.get('/registrar/preregs', isAuth, isRegistrar, async (req, res) => {
    try {
        const page = req.query.page;
        let totalPreregs = await Prereg.find().count();
        let preregs = await Prereg.find().skip((page-1)*PREREGS_PER_PAGE).limit(PREREGS_PER_PAGE);
        res.json({
            success: true,
            preregs: preregs,
            totalPreregs: totalPreregs,
            hasNextPage: PREREGS_PER_PAGE * page < totalPreregs,
            hasPreviousPage: page > 1,
            nextPage: parseInt(page) + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalPreregs/PREREGS_PER_PAGE)
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get one prereg
router.get('/registrar/preregs/:id', isAuth, isRegistrar, async (req, res) => {
    try {
        let prereg = await Prereg.findOne({ _id: req.params.id });
        res.json({
            success: true,
            prereg: prereg
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//delete one prereg
router.delete('/registrar/preregs/:id', isAuth, isRegistrar, async (req, res) => {
    try {
        let prereg = await Prereg.findOneAndDelete({ _id: req.params.id });
        res.json({
            success: true,
            prereg: prereg
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



//register student and parent account and creates student info
router.post('/registrar/preregs/:id', isAuth, isRegistrar, async (req, res) => {
    try {

        const password = "password"; // DEFAULT PASSWORD
        let hashedPassword = await bcrypt.hash(password, 12);
        let prereg = await Prereg.findOne({ _id: req.params.id });//look for prereg id
        let sequenceDocument = await Counter.findOneAndUpdate( //student id counter (START WITH 111110)
            { counter: true },
            { $inc:{sequence_value:1} },
            { new: true }
        );
        
        let getInitials = (name) => {
            let initials = name.split(' ');
            
            if(initials.length > 1) {
              initials = initials.shift().charAt(0) + initials.pop().charAt(0);
            } else {
              initials = name.substring(0, 1);
            } 
            return initials;
        }
        
        const firstNameInitials = getInitials(prereg.studentFirstName);
        const middleNameInitial = getInitials(prereg.studentMiddleName);
        const studentUsername = firstNameInitials + middleNameInitial + prereg.studentLastName;

        let student = new User({//create student user
            firstName: prereg.studentFirstName,
            middleName: prereg.studentMiddleName,
            lastName: prereg.studentLastName,
            email: prereg.email,
            phoneNum: prereg.phoneNum,
            LRNNo: prereg.LRNNo,
            password: hashedPassword,
            role: 6,
            active: 1,
            studentNumber: parseInt("" + prereg.schoolYearFrom + sequenceDocument.sequence_value), // APPEND YEARFROM BEFORE SEQUENCE_VALUE
            studentUsername: studentUsername.toLowerCase(),
            yearLevel: prereg.levelEnroll,
            firstLogin: true
        });
        await student.save();

        let parent = new User({//create parent user (uses mother name)
            firstName: prereg.motherFirstName,
            middleName: prereg.motherMiddleName,
            lastName: prereg.motherLastName,
            email: prereg.parentEmail,
            phoneNum: prereg.parentPhoneNum,
            password: hashedPassword,
            role: 5,
            active: 1,
            student_id: student._id,
            firstLogin: true
        });
        await parent.save();

        let studentinfo = new StudentInfo({
            student: student._id,
            schoolYearFrom: prereg.schoolYearFrom,
            schoolYearTo: prereg.schoolYearTo,
            //levelEnroll: prereg.levelEnroll,
            hasLRN: prereg.hasLRN,
            returning: prereg.returning,
            PSANo: prereg.PSANo,
            LRNNo: prereg.LRNNo,
            birthDate: prereg.birthDate,
            gender: prereg.gender,
            indig: prereg.indig,
            indigSpec: prereg.indigSpec,
            motherTongue: prereg.motherTongue,
            address1: prereg.address1,
            address2: prereg.address2,
            zipCode: prereg.zipCode,
            motherFirstName: prereg.motherFirstName,
            motherMiddleName: prereg.motherMiddleName,
            motherLastName: prereg.motherLastName,
            fatherFirstName: prereg.fatherFirstName,
            fatherMiddleName: prereg.fatherMiddleName,
            fatherLastName: prereg.fatherLastName,
            guardianFirstName: prereg.guardianFirstName,
            guardianMiddleName: prereg.guardianMiddleName,
            guardianLastName: prereg.guardianLastName,
            emergencyName: prereg.emergencyName,
            emergencyCellphone: prereg.emergencyCellphone,
            emergencyTelephone: prereg.emergencyTelephone,
            lastGradeLevel: prereg.lastGradeLevel,
            lastSchoolYear: prereg.lastSchoolYear,
            schoolName: prereg.schoolName,
            schoolAddress: prereg.schoolAddress,
            semester: prereg.semester,
            track: prereg.track,
            strand: prereg.strand, 
            modularP: prereg.modularP,
            modularD: prereg.modularD,
            online: prereg.online,
            educTV: prereg.educTV,
            radioBased: prereg.radioBased,
            homeschool: prereg.homeschool,
            blended: prereg.blended,
            facetoface: prereg.facetoface
        });
        await studentinfo.save();

        prereg = await Prereg.findOneAndDelete({ _id: req.params.id });

        userEmails = [student.email, parent.email];
        console.log(userEmails);
        var registrationEmail = {
            from: process.env.EMAIL,
            to: userEmails,
            subject: "TMIS registration notification!",
            html: "<h1>you are registered!</h1>" + student.firstName + " " + student.middleName + " " + student.lastName 
        };

        transporter.sendMail(registrationEmail);

        res.json({
            success: true,
            preregDeleted: prereg
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


//get all active students
router.get('/registrar/students', isAuth, isRegistrar, async (req, res) => {
    try {
        const page = req.query.page;
        let totalUsers = await User.find( {$and:[{role: 6}, {active: true}]} ).count();
        let users = await User.find( {$and:[{role: 6}, {active: true}]} ).skip((page-1)*USERS_PER_PAGE).limit(USERS_PER_PAGE);
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

//add student info here

//get one student
router.get('/registrar/students/:id', isAuth, isRegistrar, async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.params.id });
        let userInfo = await StudentInfo.findOne({ student: req.params.id });
        res.json({
            success: true,
            user: user,
            userInfo: userInfo
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//add student info here

//edit student
router.put('/registrar/students/:id', isAuth, isRegistrar, async (req, res) => {
    try {
        let user = await User.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { 
                firstName: req.body.firstName,
                middleName: req.body.middleName,
                lastName: req.body.lastName,
                phoneNum: req.body.phoneNum,
                LRNNo: req.body.LRNNo
            }},
            { new: true });
        let userInfo = await StudentInfo.findOneAndUpdate(
            { student: req.params.id },
            { $set: { 
                schoolYearFrom: req.body.schoolYearFrom,
                schoolYearTo: req.body.schoolYearTo,
                levelEnroll: req.body.levelEnroll,
                hasLRN: req.body.hasLRN,
                returning: req.body.returning,
            
                //student
                PSANo: req.body.PSANo,
                //LRNNo: req.body.LRNNo,
                //studentFirstName: { type: string, required: true },
                //studentMiddleName: { type: string, required: true },
                //studentLastName: { type: string, required: true },
                birthDate: req.body.birthDate,
                gender: req.body.gender,
                indig: req.body.indig,
                indigSpec: req.body.indigSpec,
                motherTongue: req.body.motherTongue,
                address1: req.body.address1,
                address2: req.body.address2,
                zipCode: req.body.zipCode,
                //email: { type: string, unique: true, required: true },
                //phoneNum: { type: number },
            
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
                emergencyName: req.body.emergencyName,
                emergencyCellphone: req.body.emergencyCellphone,
                emergencyTelephone: req.body.emergencyTelephone,
                //parentEmail: { type: string, unique: true, required: true },
                //parentPhoneNum: { type: number },
            
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
            }},
            { new: true });
            res.json({
                success: true,
                user: user,
                userInfo: userInfo
            });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//archive student
router.delete('/registrar/students/:id', isAuth, isRegistrar, async (req, res) => {
    try {
        let user = await User.findOneAndUpdate({ _id: req.params.id }, {active: false}, {new: true});
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

module.exports = router;