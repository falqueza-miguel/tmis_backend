const router = require('express').Router();

const Section = require('../models/section');
const Grade = require('../models/grade');

const isAuth = require('../middleware/is-auth');
const { isTeacher } = require('../middleware/is-role')

//view teacher schedule (all section schedules)
router.get('/teacher/myschedule', isAuth, isTeacher, async (req, res) => {
    try {
        //find sections by email
        let sections = await Section.find({teachers: res.locals.email});
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

//get all sections taught by subject teached
//might use id now here
router.get('/teacher/mysections', isAuth, isTeacher, async (req, res) => {
    try {
        //find sections by email
        let sections = await Section.find({teachers: res.locals.email});
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

//open section , list students , show schedule (get one section)

//print class list/info (one section)

//encode student grade 

module.exports = router;