const router = require('express').Router();

const User = require('../models/user');
const Section = require('../models/section');
const Grade = require('../models/grade');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SRV,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PW
    }
});

const isAuth = require('../middleware/is-auth');
const { isTeacher } = require('../middleware/is-role')

//user profile page
router.get('/teacher', isAuth, isTeacher, async (req, res) => {
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

//view teacher schedule (all section schedules) (ACTIVE ONLY)
router.get('/teacher/myschedule', isAuth, isTeacher, async (req, res) => {
    try {
        //find sections by email
        let sections = await Section.find({$and: [{teachers: res.locals.email}, {active: true}]});
        let section_names = [];
        let subjects = [];
        let schedules = [];
        //get subjects
        for (let section in sections){
            let section_name = sections[section].sectionName;

            let teacherArray = sections[section].teachers;
            let index = teacherArray.indexOf(res.locals.email);
            let subject = sections[section].subjects[index];
            let schedule = sections[section].schedule[index];

            subjects.push(subject);
            section_names.push(section_name);
            schedules.push(schedule);
        }

        res.json({
            success: true,
            sections: sections, // pili nalang, this (mas simple ata to)

            section_names: section_names, // or this (or baka to, display name, subject and schedule)
            subjects: subjects,
            schedules: schedules
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get all ACTIVE sections taught by subject teached
router.get('/teacher/mysections', isAuth, isTeacher, async (req, res) => {
    try {
        //find sections by email
        let sections = await Section.find({$and:[{teachers: res.locals.email}, {active: true}]});
        let section_ids = [];
        let section_names = [];
        let subjects = [];
        //get subjects
        for (let section in sections){
            let section_id = sections[section]._id;
            let section_name = sections[section].sectionName;

            let teacherArray = sections[section].teachers;
            let index = teacherArray.indexOf(res.locals.email);
            let subject = sections[section].subjects[index];

            subjects.push(subject);
            section_ids.push(section_id);
            section_names.push(section_name);
        }

        res.json({
            success: true,
            sections: sections, // pili nalang, this (mas simple ata to)

            section_ids: section_ids, // or this (or baka to, generate link with id, display name and subject)
            section_names: section_names,
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

//open section , show sched, list students , populate grade fields
router.get('/teacher/mysections/:id', isAuth, isTeacher, async (req, res) => {
    try {
        let section = await Section.findOne({ _id: req.params.id });
        let grades = await Grade.find({ sectionID: req.params.id });

        // get teacher subject and index of subject
        let teacherArray = section.teachers
        let index = teacherArray.indexOf(res.locals.email);
        let subject = section.subjects[index]; //subject and index

        // get encoded grades for subject
        let students = []
        let q1SubjGrades = []
        let q2SubjGrades = []
        let q3SubjGrades = []
        let q4SubjGrades = []
        for (grade in grades) {
            try {
                let subjectArray = grades[grade].subjects;
                let subjIndex = subjectArray.indexOf(subject);
                //let stud = section.studentNumbers[grade];
                //students.push(stud)
                q1SubjGrades.push(grades[grade].q1Grades[subjIndex]);
                q2SubjGrades.push(grades[grade].q2Grades[subjIndex]);
                q3SubjGrades.push(grades[grade].q3Grades[subjIndex]);
                q4SubjGrades.push(grades[grade].q4Grades[subjIndex]);     
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });                
            }
        }

        // console.log(students);// same
        console.log(section.studentNumbers); // same
        console.log(section.studentNames)

        console.log(q1SubjGrades)
        console.log(q2SubjGrades)
        console.log(q3SubjGrades)
        console.log(q4SubjGrades)

        res.json({
            success: true,
            section: section,
            grades: grades
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//view class list (pdf)


//encode students grades
router.post('/teacher/mysections/:id', isAuth, isTeacher, async (req, res) => {
    try {
        let section = await Section.findOne({ _id: req.params.id });

        // get teacher subject and index of subject
        let teacherArray = section.teachers
        let index = teacherArray.indexOf(res.locals.email);
        let subject = section.subjects[index]; //subject and index
        let q1SubjGrades = req.body.q1Grades;
        let q2SubjGrades = req.body.q2Grades;
        let q3SubjGrades = req.body.q3Grades;
        let q4SubjGrades = req.body.q4Grades;


        for (student in section.studentNumbers) {

            let studNum = section.studentNumbers[student];
            let user = await User.findOne({ studentNumber: studNum });
            let userParent = await User.findOne({ student_id: user._id })

            let q1g = q1SubjGrades[student];
            let q2g = q2SubjGrades[student];
            let q3g = q3SubjGrades[student];
            let q4g = q4SubjGrades[student];

            let grade = await Grade.findOne({ $and: [{ sectionID: req.params.id }, { studentNumber: studNum }] });
            let q_one = grade.q1Grades;
            let q_two = grade.q2Grades;
            let q_three = grade.q3Grades;
            let q_four = grade.q4Grades;
            

            q_one.splice(index, 1, q1g);
            q_two.splice(index, 1, q2g);
            q_three.splice(index, 1, q3g);
            q_four.splice(index, 1, q4g);


            await Grade.findOneAndUpdate(
                { $and: [{ sectionID: req.params.id }, { studentNumber: studNum }] }, 
                { $set: { 
                    q1Grades: q_one,
                    q2Grades: q_two,
                    q3Grades: q_three,
                    q4Grades: q_four
                }},
                { new: true });
            console.log(grade);

            userEmails = [user.email, userParent.email];
            console.log(userEmails);
            var gradeEncodedEmail = {
                from: process.env.EMAIL,
                to: userEmails,
                subject: "TMIS grades notification!",
                html: "<h1>merry christmas you filthy animal</h1>" + user.firstName + " " + user.middleName + " " + user.lastName 
            };
    
            transporter.sendMail(gradeEncodedEmail);
        }

        res.json({
            success: true,
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