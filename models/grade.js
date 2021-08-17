const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GradeSchema = new Schema({
    studentNumber: { type: String, required: true }, // studentNumber
    sectionID: { type: String, required: true }, // reference section _id here when creating 

    schoolYearFrom: { type: String, required: true }, // reference section schoolyear
    schoolYearTo: { type: String, required: true },
    yearLevel: { type: String, required: true }, // reference section yearlevel
    sectionName: { type: String, required: true }, // reference section sectionname

    subjects: { type: Array, required: true }, // all three must be same length
    teachers: { type: Array, required: true }, // DATABASE _id or Email
    grades: { type: Array } //array of arrays
});

module.exports = mongoose.model('Grade', GradeSchema)