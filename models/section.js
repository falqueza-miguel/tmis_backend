const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SectionSchema = new Schema({
    schoolYearFrom: { type: String, required: true },
    schoolYearTo: { type: String, required: true },
    yearLevel: { type: String, required: true },
    sectionName: { type: String, required: true },
    students: { type: Array, required: true }, //student studentNumbers

    subjects: [{ type: String, required: true }], //all three must be same length
    schedule: [{ type: String, required: true }],
    teachers: [{ type: String, required: true }], //teacher ids
    
    active: { type: Boolean, required: true }
});

module.exports = mongoose.model('Section', SectionSchema)