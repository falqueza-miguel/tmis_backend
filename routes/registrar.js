const router = require('express').Router();
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Prereg = require('../models/prereg');

const isAuth = require('../middleware/is-auth');
const { isRegistrar } = require('../middleware/is-role');
const StudentInfo = require('../models/studentinfo');

//get all preregs
router.get('/registrar/preregs', isAuth, isRegistrar, async (req, res) => {
    try {
        let preregs = await Prereg.find();
        res.json({
            success: true,
            preregs: preregs
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


//register student and parent account and creates student info
//could add student number
router.post('/registrar/preregs/:id', isAuth, isRegistrar, async (req, res) => {
    try {
        let prereg = await Prereg.findOne({ _id: req.params.id });//look for prereg id
        let student = new User({//create student user
            firstName: prereg.studentFirstName,
            middleName: prereg.studentMiddleName,
            lastName: prereg.studentLastName,
            email: prereg.email,
            phoneNum: prereg.phoneNum,
            password: 'test',
            role: 6,
            active: 1
        });
        await student.save();
        let parent = new User({//create parent user (uses mother name)
            firstName: prereg.motherFirstName,
            middleName: prereg.motherMiddleName,
            lastName: prereg.motherLastName,
            email: prereg.parentEmail,
            phoneNum: prereg.parentPhoneNum,
            password: 'test',
            role: 5,
            active: 1,
            student_id: student._id
        });
        await parent.save();
        let studentinfo = new StudentInfo({
            student: student._id,
            schoolYear: prereg.schoolYear,
            levelEnroll: prereg.levelEnroll,
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
        let users = await User.find( {$and:[{role: 6}, {active: true}]} );
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

//get one student
router.get('/registrar/students/:id', isAuth, isRegistrar, async (req, res) => {
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

//edit student
router.put('/registrar/students/:id', isAuth, isRegistrar, async (req, res) => {
    try {
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