const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GradeSchema = new Schema({
    studentLRN: { type: Number, required: true }, // LRN
    sectionID: { type: String, required: true }, // reference section _id here when creating 

    schoolYearFrom: { type: String, required: true }, // reference section schoolyear
    schoolYearTo: { type: String, required: true },
    yearLevel: { type: String, required: true }, // reference section yearlevel
    semester: { type: String }, // for shs only
    strand: { type: String }, // for shs only
    sectionName: { type: String, required: true }, // reference section sectionname

    subjects: [{ type: String, required: true }], // must be same length
    teachers: [{ type: String, required: true }], // email
    q1Grades: [{ type: String }], //shs prelim
    q2Grades: [{ type: String }], //shs final
    q3Grades: [{ type: String }],
    q4Grades: [{ type: String }],
    computedGrades: [{ type: String }],
    finalGrades: [{ type: String }],
    remarks: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Grade', GradeSchema)