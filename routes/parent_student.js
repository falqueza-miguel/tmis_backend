const router = require('express').Router();

const User = require('../models/user');
const Section = require('../models/section');
const Grade = require('../models/grade');
const Balance = require('../models/balance');
const Payinfo = require('../models/payinfo');

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
        let section = await Section.findOne({$and: [{ studentLRNs: student.LRNNo }, {active: true }]}).sort({ createdAt: -1 });

        let scheds = []
        for (schedule in section.subjects){
            let teacher = await User.findOne({email: section.teachers[schedule]})
            let name = teacher.lastName + " " + teacher.firstName
            let sched = {
                "yearLevel": section.yearLevel,
                "section": section.sectionName,
                "subject": section.subjects[schedule],
                "schedule": section.schedule[schedule],
                "teacher": section.teachers[schedule],
                "name": name
            }
            scheds.push(sched);
        }
        let title = {
            "yearLevel": section.yearLevel,
            "section": section.sectionName,
        }
        res.json({
            success: true,
            schedule: scheds,
            title: title
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
        let section = await Section.findOne({$and: [{ studentLRNs: student.LRNNo }, {active: true }]}).sort({ createdAt: -1 });

        let scheds = []
        for (schedule in section.subjects){
            let teacher = await User.findOne({email: section.teachers[schedule]})
            let name = teacher.lastName + " " + teacher.firstName
            let sched = {
                "yearLevel": section.yearLevel,
                "section": section.sectionName,
                "subject": section.subjects[schedule],
                "schedule": section.schedule[schedule],
                "teacher": section.teachers[schedule],
                "name": name
            }
            scheds.push(sched);
        }
        let title = {
            "yearLevel": section.yearLevel,
            "section": section.sectionName,
        }
        res.json({
            success: true,
            schedule: scheds,
            title: title
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

        let gradeLatest = []
        for (subj in latestGrade.subjects){
            let grade = {
                "subject": latestGrade.subjects[subj],
                "q1Grade": latestGrade.q1Grades[subj],
                "q2Grade": latestGrade.q2Grades[subj],
                "q3Grade": latestGrade.q3Grades[subj],
                "q4Grade": latestGrade.q4Grades[subj],
                "computedGrade": latestGrade.computedGrades[subj],
                "finalGrade": latestGrade.finalGrades[subj],
                "remark": latestGrade.remarks[subj],
            }
            gradeLatest.push(grade)
        }
        let gradeLatestInfo = {
            sectionID: latestGrade._id,
            sectionName: latestGrade.schoolYearFrom + "-" + latestGrade.schoolYearTo + ", " + latestGrade.yearLevel + " " + latestGrade.sectionName,
            sectionYearLevel: latestGrade.yearLevel
        }


        let grades = [];
        let gradesInfo = [];
        for (grade in allGrades){
            let currentGrades = []
            let current = allGrades[grade]
            for (subject in current.subjects){
                let grade = {
                    "subject": current.subjects[subject],
                    "q1Grade": current.q1Grades[subject],
                    "q2Grade": current.q2Grades[subject],
                    "q3Grade": current.q3Grades[subject],
                    "q4Grade": current.q4Grades[subject],
                    "computedGrade": current.computedGrades[subject],
                    "finalGrade": current.finalGrades[subject],
                    "remark": current.remarks[subject],
                }
               currentGrades.push(grade)
            }
            let sectInfo = {
            sectionID: allGrades[grade]._id,
            sectionName: allGrades[grade].schoolYearFrom + "-" + allGrades[grade].schoolYearTo + ", " + allGrades[grade].yearLevel + " " + allGrades[grade].sectionName,
            sectionYearLevel: allGrades[grade].yearLevel
            }
        gradesInfo.push(sectInfo)    
        grades.push(currentGrades)
        }

        gradesInfo.shift()
        grades.shift()
        console.log(gradeLatest)
        res.json({
            success: true,
            gradeLatest: gradeLatest,
            gradeLatestInfo: gradeLatestInfo,
            grades: grades,
            gradesInfo: gradesInfo
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
        console.log(latestGrade)
        let gradeLatest = []
        for (subj in latestGrade.subjects){
            let grade = {
                "subject": latestGrade.subjects[subj],
                "q1Grade": latestGrade.q1Grades[subj],
                "q2Grade": latestGrade.q2Grades[subj],
                "q3Grade": latestGrade.q3Grades[subj],
                "q4Grade": latestGrade.q4Grades[subj],
                "computedGrade": latestGrade.computedGrades[subj],
                "finalGrade": latestGrade.finalGrades[subj],
                "remark": latestGrade.remarks[subj],
            }
            gradeLatest.push(grade)
        }
        let gradeLatestInfo = {
            sectionID: latestGrade._id,
            sectionName: latestGrade.schoolYearFrom + "-" + latestGrade.schoolYearTo + ", " + latestGrade.yearLevel + " " + latestGrade.sectionName,
            sectionYearLevel: latestGrade.yearLevel
        }


        let grades = [];
        let gradesInfo = [];
        for (grade in allGrades){
            let currentGrades = []
            let current = allGrades[grade]
            for (subject in current.subjects){
                let grade = {
                    "subject": current.subjects[subject],
                    "q1Grade": current.q1Grades[subject],
                    "q2Grade": current.q2Grades[subject],
                    "q3Grade": current.q3Grades[subject],
                    "q4Grade": current.q4Grades[subject],
                    "computedGrade": current.computedGrades[subject],
                    "finalGrade": current.finalGrades[subject],
                    "remark": current.remarks[subject],
                }
               currentGrades.push(grade)
            }
            let sectInfo = {
                sectionID: allGrades[grade]._id,
                sectionName: allGrades[grade].schoolYearFrom + "-" + allGrades[grade].schoolYearTo + ", " + allGrades[grade].yearLevel + " " + allGrades[grade].sectionName,
                sectionYearLevel: allGrades[grade].yearLevel
                }
            gradesInfo.push(sectInfo)
            grades.push(currentGrades)
        }

        gradesInfo.shift()
        grades.shift()
        console.log(gradeLatest)
        console.log(grades)
        res.json({
            success: true,
            gradeLatest: gradeLatest,
            gradeLatestInfo: gradeLatestInfo,
            grades: grades,
            gradesInfo: gradesInfo
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
        let bal = 0
        var latestBalObject = latestBalance.toObject()
        let runLatestBalance = []
        for (i in latestBalance.transactionType) {
        bal = (bal + latestBalance.debit[i]) - latestBalance.credit[i]
        runLatestBalance.push(bal)
        }
        latestBalObject.runBalance = runLatestBalance

        let payment = 0
        let scheduleAmount = []
        let schedulePeriod = []
        if (latestBalObject.paymentTerms.toUpperCase() == "YEARLY"){
            for (i in latestBalObject.transactionType){
                if (latestBalObject.transactionType[i] == "TUITION" && latestBalObject.debit[i] > 0){
                    payment = payment + latestBalObject.debit[i]
                }
            }
            scheduleAmount.push(payment)
            schedulePeriod.push("Y1")
        } else if (latestBalObject.paymentTerms.toUpperCase() == "QUARTERLY"){
            for (i in latestBalObject.transactionType){
                if (latestBalObject.transactionType[i] == "TUITION" && latestBalObject.debit[i] > 0){
                    payment = payment + latestBalObject.debit[i]
                }
            }
            payment = payment / 4
            for (let i = 0; i < 4; i++) {
                let shift = parseFloat(i) + parseFloat(1)
                scheduleAmount.push(payment)
                schedulePeriod.push("Q"+shift)
            }
        } else if (latestBalObject.paymentTerms.toUpperCase() == "MONTHLY"){
            for (i in latestBalObject.transactionType){
                if (latestBalObject.transactionType[i] == "TUITION" && latestBalObject.debit[i] > 0){
                    payment = payment + latestBalObject.debit[i]
                }
            }
            payment = payment / 10
            for (let i = 0; i < 10; i++) {
                let shift = parseFloat(i) + parseFloat(1)
                scheduleAmount.push(payment)
                schedulePeriod.push("M"+shift)
            }
        }
        latestBalObject.scheduleAmount = scheduleAmount
        latestBalObject.schedulePeriod = schedulePeriod
        console.log(latestBalObject)

        let allBalances = await Balance.find({ student: parent.student_id }).sort({ createdAt: -1});
        allBalances.shift()
        let allBalanceObjects = []
        for (i in allBalances){
            let bals = 0
            let runBalance = []
            let balObject = allBalances[i].toObject()
            for (i in balObject.transactionType) {
                bals = (bals + balObject.debit[i]) - balObject.credit[i]
                runBalance.push(bals)
            }
            balObject.runBalance = runBalance
            allBalanceObjects.push(balObject)
        }

        res.json({
            success: true,
            latestBalance: latestBalObject,
            //allBalances: allBalanceObjects
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


//view paymentinfo (parent) 
router.get('/parent/payinfo', isAuth, isParent, async (req, res) => {
    try {
        let payinfo = await Payinfo.find().sort({ createdAt: -1})
        res.json({
            success: true,
            payinfo: payinfo,
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