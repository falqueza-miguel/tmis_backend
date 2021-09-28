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
                if (teacherArray[teacher] == res.locals.email ){
                    let subject = sections[section].subjects[teacher];
                    let schedule = sections[section].schedule[teacher];
        
                    subjects.push(subject);
                    schedules.push(schedule);
                    section_names.push(section_name);
                }

            }
        }
    
        let scheds = []
        for (let sec in section_names){
            let sched = {
                "schedule": schedules[sec],
                "subject":  subjects[sec],
                "section":  section_names[sec]
            }
            scheds.push(sched)
        }

        res.json({
            success: true,
            scheds: scheds
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
        let year_levels = [];
        //get subjects
        for (let section in sections){
            let section_id = sections[section]._id;
            let section_name = sections[section].sectionName;

            let teacherArray = sections[section].teachers;
            for (let teacher in teacherArray){
                if (teacherArray[teacher] == res.locals.email ){
                    let subject = sections[section].subjects[teacher];
                    let yearLevel = sections[section].yearLevel;
                    
                    year_levels.push(yearLevel);
                    subjects.push(subject);
                    section_ids.push(section_id);
                    section_names.push(section_name);
                }
            }
        }

        let sections_list = []
        for (let sect in section_names){
            let sec = {
                "name": section_names[sect],
                "yearLevel":  year_levels[sect],
                "subject":  subjects[sect],
                "id": section_ids[sect]
            }
            sections_list.push(sec);
        }

        res.json({
            success: true,
            sections_list: sections_list,

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

//open section , show sched, list students ALPHABETICALLY , populate grade fields
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

                    // alphabetize students
                    let alphabetizedStudentLRNs = [];
                    let alphabetizedStudentNames = [];
                    let unorganizedStudentNames = [];
                    // get array of student names
                    for (student in section.studentLRNs) {
                        // try {
                            let user = await User.findOne({LRNNo: section.studentLRNs[student]});
                            // console.log(user)
                            // console.log(section.studentLRNs)
                            let fullName = user.lastName + ", " + user.firstName + " " + user.middleName + " " + user.LRNNo;
                            unorganizedStudentNames.push(fullName);
                        // }
                        // catch (error) {
                        //     res.status(500).json({
                        //         success: false,
                        //         message: error.message
                        //     });                
                        // }
                    }

                    unorganizedStudentNames.sort(); // sort student names with LRNs alphabetically by last name

                    for (student in unorganizedStudentNames){ // slices student LRNs from names
                        // try {
                            let name = unorganizedStudentNames[student];
                            let studName = name.slice(0, name.length - 12)
                            let studLRN = name.slice(name.length - 12);
                            alphabetizedStudentNames.push(studName.trim());
                            alphabetizedStudentLRNs.push(studLRN.trim());
                        // }
                        // catch (error) {
                        //     res.status(500).json({
                        //         success: false,
                        //         message: error.message
                        //     });                  
                        // }
                    }

                    let q1SubjGrades = []
                    let q2SubjGrades = []
                    let q3SubjGrades = []
                    let q4SubjGrades = []
                    for (student in alphabetizedStudentLRNs){
                        // try {
                            let studentGrades = await Grade.findOne({$and: [ {sectionID: req.params.id} , {studentLRN: alphabetizedStudentLRNs[student]}]});
                            // get encoded grades for subject
                            //let students = []

                            let subjectArray = studentGrades.subjects;
                            let subjIndex = subjectArray.indexOf(subject);
                            //let stud = section.studentLRNs[grade];
                            //students.push(stud)
                            q1SubjGrades.push(studentGrades.q1Grades[subjIndex]);
                            q2SubjGrades.push(studentGrades.q2Grades[subjIndex]);
                            q3SubjGrades.push(studentGrades.q3Grades[subjIndex]);
                            q4SubjGrades.push(studentGrades.q4Grades[subjIndex]);
                        // }
                        // catch (error) {
                        //     res.status(500).json({
                        //         success: false,
                        //         message: error.message
                        //     });       
                        // }
                    }
                    
                    console.log(alphabetizedStudentNames)
                    console.log(q1SubjGrades)
                    console.log(q2SubjGrades)
                    console.log(q3SubjGrades)
                    console.log(q4SubjGrades)
            
                    let students_list = []
                    for (let student in alphabetizedStudentNames){
                        let stud = {
                            "name": alphabetizedStudentNames[student],
                            "LRN": alphabetizedStudentLRNs[student],
                            "q1Grade": q1SubjGrades[student],
                            "q2Grade": q2SubjGrades[student],
                            "q3Grade": q3SubjGrades[student],
                            "q4Grade": q4SubjGrades[student]
                        }
                        students_list.push(stud);
                    }

                    console.log(students_list)

                    // students_list.sort(function(a, b) {
                    //     var textA = a.lastName.toUpperCase();
                    //     var textB = b.lastName.toUpperCase();
                    //     return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                    // });

                    return res.json({
                        success: true,
                        section: section,
                        students_list: students_list
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
        console.log(error)
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
                    
                    students = req.body.students

                    for (student in students) {
            
                        let studNum = students[student].LRN;
                        let user = await User.findOne({ LRNNo: studNum });
                        let userParent = await User.findOne({ student_id: user._id })
            
                        let q1g = students[student].q1Grade;
                        let q2g = students[student].q2Grade;
                        let q3g = students[student].q3Grade;
                        let q4g = students[student].q4Grade;
                        let compg = students[student].computedGrade;
                        let rems = students[students].gradeRemark;
            
                        let grade = await Grade.findOne({ $and: [{ sectionID: req.params.id }, { studentLRN: studNum }] });
                        let q_one = grade.q1Grades;
                        let q_two = grade.q2Grades;
                        let q_three = grade.q3Grades;
                        let q_four = grade.q4Grades;
                        let c_grade = grade.computedGrades;
                        let g_remark = grade.remarks;
            
                        q_one.splice(subj, 1, q1g);
                        q_two.splice(subj, 1, q2g);
                        q_three.splice(subj, 1, q3g);
                        q_four.splice(subj, 1, q4g);
                        c_grade.splice(subj, 1, compg);
                        g_remark.splice(subj, 1, rems);
            
            
                        await Grade.findOneAndUpdate(
                            { $and: [{ sectionID: req.params.id }, { studentLRN: studNum }] }, 
                            { $set: { 
                                q1Grades: q_one,
                                q2Grades: q_two,
                                q3Grades: q_three,
                                q4Grades: q_four,
                                computedGrades: c_grade,
                                remarks: g_remark
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