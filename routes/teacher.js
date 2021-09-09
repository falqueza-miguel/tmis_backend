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
const SECTIONS_PER_PAGE = 1000;

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
            for (let teacher in teacherArray){
                console.log(teacher)
                if (teacherArray[teacher] == res.locals.email ){
                    let subject = sections[section].subjects[teacher];
                    let schedule = sections[section].schedule[teacher];
        
                    subjects.push(subject);
                    schedules.push(schedule);
                    section_names.push(section_name);
                }

            }
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
        const page = req.query.page;
        let totalSections = await Section.find({$and:[{teachers: res.locals.email}, {active: true}]}).count();
        let sections = await Section.find({$and:[{teachers: res.locals.email}, {active: true}]}).skip((page-1)*SECTIONS_PER_PAGE).limit(SECTIONS_PER_PAGE);
        let section_ids = [];
        let section_names = [];
        let subjects = [];
        //get subjects
        for (let section in sections){
            let section_id = sections[section]._id;
            let section_name = sections[section].sectionName;

            let teacherArray = sections[section].teachers;
            for (let teacher in teacherArray){
                if (teacherArray[teacher] == res.locals.email ){
                    let subject = sections[section].subjects[teacher];
    
                    subjects.push(subject);
                    section_ids.push(section_id);
                    section_names.push(section_name);
                }
            }
        }

        res.json({
            success: true,
            sections: sections, // pili nalang, this (mas simple ata to)

            section_ids: section_ids, // or this (or baka to, generate link with id, display name and subject)
            section_names: section_names,
            subjects: subjects,

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

//open section , show sched, list students , populate grade fields
router.get('/teacher/mysections/:id', isAuth, isTeacher, async (req, res) => {
    try {
        let section = await Section.findOne({ _id: req.params.id });
        let subject = req.query.subject;

        //check if subject is in section
        let teacherArray = section.teachers
        let subjectArray = section.subjects;
        for (let subj in subjectArray){
            if (subjectArray[subj] == subject){
                console.log(teacherArray[subj])
                if (teacherArray[subj] == res.locals.email){
                    console.log( res.locals.email +' teaches '+ req.query.subject);
                    let grades = await Grade.find({ sectionID: req.params.id });

                    // get teacher subject and index of subject
                    // let teacherArray = section.teachers
                    // let index = teacherArray.indexOf(res.locals.email);
                    // let subject = section.subjects[index]; //subject and index
            
                    // get encoded grades for subject
                    //let students = []
                    let q1SubjGrades = []
                    let q2SubjGrades = []
                    let q3SubjGrades = []
                    let q4SubjGrades = []
                    for (grade in grades) {
                        try {
                            let subjectArray = grades[grade].subjects;
                            let subjIndex = subjectArray.indexOf(subject);
                            //let stud = section.studentLRNs[grade];
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
                    console.log(section.studentLRNs); // same
                    console.log(section.studentNames)
            
                    console.log(q1SubjGrades)
                    console.log(q2SubjGrades)
                    console.log(q3SubjGrades)
                    console.log(q4SubjGrades)
            
                    return res.json({
                        success: true,
                        section: section,
                        grades: grades
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: "teacher doesnt teach subject"
                });
            }
        }
        return res.status(500).json({
            success: false,
            message: "subject doesnt exist in section"
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
        let subject = req.query.subject;

        //check if subject is in section
        let teacherArray = section.teachers
        let subjectArray = section.subjects;
        for (let subj in subjectArray){
            if (subjectArray[subj] == subject){
                console.log(teacherArray[subj])
                if (teacherArray[subj] == res.locals.email){
                    // let subject = section.subjects[index]; //subject and index
                    let q1SubjGrades = req.body.q1Grades;
                    let q2SubjGrades = req.body.q2Grades;
                    let q3SubjGrades = req.body.q3Grades;
                    let q4SubjGrades = req.body.q4Grades;
            
            
                    for (student in section.studentLRNs) {
            
                        let studNum = section.studentLRNs[student];
                        let user = await User.findOne({ LRNNo: studNum });
                        let userParent = await User.findOne({ student_id: user._id })
            
                        let q1g = q1SubjGrades[student];
                        let q2g = q2SubjGrades[student];
                        let q3g = q3SubjGrades[student];
                        let q4g = q4SubjGrades[student];
            
                        let grade = await Grade.findOne({ $and: [{ sectionID: req.params.id }, { studentLRN: studNum }] });
                        let q_one = grade.q1Grades;
                        let q_two = grade.q2Grades;
                        let q_three = grade.q3Grades;
                        let q_four = grade.q4Grades;
                        
            
                        q_one.splice(subj, 1, q1g);
                        q_two.splice(subj, 1, q2g);
                        q_three.splice(subj, 1, q3g);
                        q_four.splice(subj, 1, q4g);
            
            
                        await Grade.findOneAndUpdate(
                            { $and: [{ sectionID: req.params.id }, { studentLRN: studNum }] }, 
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
                            bcc: userEmails,
                            subject: "TMIS grades notification!",
                            html: "<h1>merry christmas you filthy animal</h1>" + user.firstName + " " + user.middleName + " " + user.lastName 
                        };
                
                        transporter.sendMail(gradeEncodedEmail);
                    }
            
                    return res.json({
                        success: true,
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: "teacher doesnt teach subject"
                });
            }
        }
        return res.status(500).json({
            success: false,
            message: "subject doesnt exist in section"
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