const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SectionSchema = new Schema({
    schoolYearFrom: { type: String, required: true },
    schoolYearTo: { type: String, required: true },
    yearLevel: { type: String, required: true },
    strand: { type: String }, //for shs only
    semester: { type: String }, //for shs only
    sectionName: { type: String, required: true },

    studentLRNs: [{ type: Number, required: true }], //both must be same length and alphabetized by last name
    studentNames: [{ type: String, required: true }],

    subjects: [{ type: String, required: true }], //all three must be same length
    schedule: [{ type: String, required: true }],
    teachers: [{ type: String, required: true }], //teacher ids
    
    active: { type: Boolean, required: true }
});

module.exports = mongoose.model('Section', SectionSchema)