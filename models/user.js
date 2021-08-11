const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNum: { type: Number },
    password: {type: String, required: true}, //hashed
    role: {type: Number, required: true},
    active: {type: Boolean, required: true},
    resetToken: {type: String},
    resetTokenExpiration: {type: Date}
});

module.exports = mongoose.model('User', UserSchema)