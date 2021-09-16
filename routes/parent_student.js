const router = require('express').Router();

const User = require('../models/user');
const Section = require('../models/section');
const Grade = require('../models/grade');
const Balance = require('../models/balance');

const isAuth = require('../middleware/is-auth');
const { isParent, isStudent, isPS } = require('../middleware/is-role')

//PARENT AND STUDENT

//user profile page (parent)
router.get('/parent', isAuth, isParent, async (req, res) => {
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

//user profile page (student)
router.get('/student', isAuth, isStudent, async (req, res) => {
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

//view sched (parent)
router.get('/parent/schedule', isAuth, isParent, async (req, res) => {
    try {
        let parent = await User.findOne({ _id: res.locals._id });
        console.log(parent);
        let student = await User.findOne({ _id: parent.student_id });
        console.log(student);
        let section = await Section.findOne({$and: [{ studentLRNs: student.LRNNo }, {active: true }]});

        let scheds = []
        for (schedule in section.subjects){
            let sched = {
                "subject": section.subjects[schedule],
                "schedule": section.schedule[schedule],
                "teacher": section.teachers[schedule]
            }
            scheds.push(sched);
        }

        res.json({
            success: true,
            sectionName: section.sectionName,
            schedule: scheds
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
        let section = await Section.findOne({$and: [{ studentLRNs: student.LRNNo }, {active: true }]});

        let scheds = []
        for (schedule in section.subjects){
            let sched = {
                "subject": section.subjects[schedule],
                "schedule": section.schedule[schedule],
                "teacher": section.teachers[schedule]
            }
            scheds.push(sched);
        }

        res.json({
            success: true,
            sectionName: section.sectionName,
            schedule: scheds
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
        let latestGrade = await Grade.findOne({ studentLRN: student.LRNNo }).sort({ createdAt: -1 });       
        let allGrades = await Grade.find({ studentLRN: student.LRNNo }).sort({ createdAt: -1});
        let allGradeIDs = [];
        let allGradeTitles = [];
        for (grade in allGrades){
            allGradeIDs.push(allGrades[grade]._id);
            allGradeTitles.push(allGrades[grade].schoolYearFrom + "-" + allGrades[grade].schoolYearTo + ", " + allGrades[grade].sectionName);
        }

        let latestGrades = []
        for (subject in latestGrade.subjects){
            let grade = {
                "subject": latestGrade.subjects[subject],
                "q1Grade": latestGrade.q1Grades[subject],
                "q2Grade": latestGrade.q2Grades[subject],
                "q3Grade": latestGrade.q3Grades[subject],
                "q4Grade": latestGrade.q4Grades[subject],
            }
            latestGrades.push(grade)
        }

        res.json({
            success: true,
            latestGrades: latestGrades,
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
        let latestGrade = await Grade.findOne({ studentLRN: student.LRNNo }).sort({ createdAt: -1 });       
        let allGrades = await Grade.find({ studentLRN: student.LRNNo }).sort({ createdAt: -1});
        let allGradeIDs = [];
        let allGradeTitles = [];
        for (grade in allGrades){
            allGradeIDs.push(allGrades[grade]._id);
            allGradeTitles.push(allGrades[grade].schoolYearFrom + "-" + allGrades[grade].schoolYearTo + ", " + allGrades[grade].sectionName);
        }

        let latestGrades = []
        for (subject in latestGrade.subjects){
            let grade = {
                "subject": latestGrade.subjects[subject],
                "q1Grade": latestGrade.q1Grades[subject],
                "q2Grade": latestGrade.q2Grades[subject],
                "q3Grade": latestGrade.q3Grades[subject],
                "q4Grade": latestGrade.q4Grades[subject],
            }
            latestGrades.push(grade)
        }

        res.json({
            success: true,
            latestGrades: latestGrades,
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

//view old grades (baka pwede na extrapolate data from last page to here sa react (allGrades))
router.get('/mygrades/:id', isAuth, isParent, async (req, res) => {
    try {
        let grade = await Grade.findOne({ _id: req.params.id });
        let parent = await User.findOne({ _id: res.locals._id })
        let student = await User.findOne({ _id: parent.student_id });
        let allGrades = await Grade.find({ studentLRN: student.LRNNo })
        if (!grade.studentLRN == student.LRNNo){
            res.status(500).json({ success: false, message: "not your grade!"}).redirect("/");
        }

        let grades = []
        for (subject in grade.subjects){
            let grade = {
                "subject": latestGrade.subjects[subject],
                "q1Grade": latestGrade.q1Grades[subject],
                "q2Grade": latestGrade.q2Grades[subject],
                "q3Grade": latestGrade.q3Grades[subject],
                "q4Grade": latestGrade.q4Grades[subject],
            }
            grades.push(grade)
        }

        res.json({
            success: true,
            grades: grades,
            allGrades: allGrades
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/mygrades/:id', isAuth, isStudent, async (req, res) => {
    try {
        let grade = await Grade.findOne({ _id: req.params.id });
        let user = await User.findOne({ _id: res.locals._id })
        let allGrades = await Grade.find({ studentLRN: user.LRNNo })
        if (!grade.studentLRN == user.LRNNo){
            res.status(500).json({ success: false, message: "not your grade!"}).redirect("/");
        }
        let grades = []
        for (subject in grade.subjects){
            let grade = {
                "subject": latestGrade.subjects[subject],
                "q1Grade": latestGrade.q1Grades[subject],
                "q2Grade": latestGrade.q2Grades[subject],
                "q3Grade": latestGrade.q3Grades[subject],
                "q4Grade": latestGrade.q4Grades[subject],
            }
            grades.push(grade)
        }
        res.json({
            success: true,
            grades: grades,
            allGrades: allGrades
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

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