const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubjectSchema = new Schema({
    gradeLevel: { type: Number, required: true },
    strand: { type: String },
    semester: { type: String },
    subjects: [{ type: String }],
});

module.exports = mongoose.model('Subject', SubjectSchema)