const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNum: { type: String }, //for formatting
    password: { type: String, required: true }, //hashed
    role: { type: Number, required: true },
    active: { type: Boolean, required: true },
    resetToken: { type: String },
    resetTokenExpiration: { type: Date },
    student_id: { type: String }, // links parent to student (student._id)
    studentNumber: { type: Number }, // system generated student number
    LRNNo: { type: Number, unique: true }, // LRN student number
    yearLevel: { type: String },
    studentUsername: { type: String, unique: true }, //student username for login
    firstLogin: { type: Boolean, required: true },
    department: { type: String } // for teacher
});

module.exports = mongoose.model('User', UserSchema)