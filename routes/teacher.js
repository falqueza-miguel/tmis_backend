const router = require('express').Router();

const Section = require('../models/section');
const Grade = require('../models/grade');

const isAuth = require('../middleware/is-auth');
const { isTeacher } = require('../middleware/is-role')

//view teacher schedule (all section schedules)

//get sections by subject teached

//open section , list students , show schedule (get one section)

//print class list/info (one section)

//encode student grade 

module.exports = router;