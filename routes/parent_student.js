const router = require('express').Router();

const User = require('../models/user');
const Section = require('../models/section');
const Grade = require('../models/grade');
const Balance = require('../models/balance');

const isAuth = require('../middleware/is-auth');
const { isParent, isStudent, isPS } = require('../middleware/is-role')

//PARENT AND STUDENT

//view sched (parent)
router.get('/parent/schedule', isAuth, isParent, async (req, res) => {
    try {
        let parent = await User.findOne({ _id: res.locals._id });
        console.log(parent);
        let student = await User.findOne({ _id: parent.student_id });
        console.log(student);
        let section = await Section.findOne({$and: [{ studentNumbers: student.studentNumber }, {active: true }]});
        res.json({
            success: true,
            sectionName: section.sectionName,
            subjects: section.subjects,
            schedule: section.schedule
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//view sched (student)
router.get('/student/schedule', isAuth, isStudent, async (req, res) => {
    try {
        let student = await User.findOne({ _id: res.locals._id });
        console.log(student);
        let section = await Section.findOne({$and: [{ studentNumbers: student.studentNumber }, {active: true }]});
        res.json({
            success: true,
            sectionName: section.sectionName,
            subjects: section.subjects,
            schedule: section.schedule
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//view grades (parent) (displays latest grades)
router.get('/parent/grades', isAuth, isParent, async (req, res) => {
    try {
        let parent = await User.findOne({ _id: res.locals._id });
        let student = await User.findOne({ _id: parent.student_id });
        let latestGrade = await Grade.findOne({ studentNumber: student.studentNumber }).sort({ createdAt: -1 });       
        let allGrades = await Grade.find({ studentNumber: student.studentNumber }).sort({ createdAt: -1});
        let allGradeIDs = [];
        let allGradeTitles = [];
        for (grade in allGrades){
            allGradeIDs.push(allGrades[grade]._id);
            allGradeTitles.push(allGrades[grade].schoolYearFrom + "-" + allGrades[grade].schoolYearTo + ", " + allGrades[grade].sectionName);
        }
        res.json({
            success: true,
            latestGrade: latestGrade,
            allGradeIDs: allGradeIDs, //use for generating links to past grades
            allGradeTitles: allGradeTitles
        });
        
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//view grades (student) (displays latest grades)
router.get('/student/grades', isAuth, isStudent, async (req, res) => {
    try {
        let student = await User.findOne({ _id: res.locals._id });
        let latestGrade = await Grade.findOne({ studentNumber: student.studentNumber }).sort({ createdAt: -1 });       
        let allGrades = await Grade.find({ studentNumber: student.studentNumber }).sort({ createdAt: -1});
        let allGradeIDs = [];
        let allGradeTitles = [];
        for (grade in allGrades){
            allGradeIDs.push(allGrades[grade]._id);
            allGradeTitles.push(allGrades[grade].schoolYearFrom + "-" + allGrades[grade].schoolYearTo + ", " + allGrades[grade].sectionName);
        }
        res.json({
            success: true,
            latestGrade: latestGrade,
            allGradeIDs: allGradeIDs, //use for generating links to past grades
            allGradeTitles: allGradeTitles
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//view old grades for parent and student
//i think we can work something out in frontend

//PARENT

//view payment information

//view balance
router.get('/parent/balance', isAuth, isParent, async (req, res) => {
    try {
        let parent = await User.findOne({ _id: res.locals._id });
        console.log(parent);
        let latestBalance = await Balance.findOne({ student: parent.student_id }).sort({ createdAt: -1});
        let allBalances = await Balance.find({ student: parent.student_id }).sort({ createdAt: -1});
        let allBalanceIDs = [];
        let allBalanceTitles = [];
        for (balance in allBalances){
            allBalanceIDs.push(allBalances[balance]._id);
            allBalanceTitles.push(allBalances[balance].schoolYearFrom + "-" + allBalances[balance].schoolYearTo);
        }
        res.json({
            success: true,
            latestBalance: latestBalance,
            allBalanceIDs: allBalanceIDs, //use for generating links to past balances
            allBalanceTitles: allBalanceTitles
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//view old balance for parents
//i think we can work something out in frontend


module.exports = router;