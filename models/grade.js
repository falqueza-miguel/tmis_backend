const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GradeSchema = new Schema({
    studentID: { type: String, required: true },
    sectionID: { type: String, required: true },

    subjects: { type: Array, required: true }, //all three must be same length
    teachers: { type: Array, required: true }, //teacher ids
    grades: { type: Array } //array of arrays
});

module.exports = mongoose.model('Grade', GradeSchema)