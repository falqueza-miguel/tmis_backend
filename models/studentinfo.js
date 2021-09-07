const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentInfoSchema = new Schema({
  
    student: { type: String, required: true }, //manually reference _id of student 

    schoolYearFrom: { type: String, required: true },
    schoolYearTo: { type: String, required: true },
    //levelEnroll: { type: String, required: true },
    hasLRN: { type: Boolean, required: true },
    returning: { type: Boolean, required: true },

    //student
    PSANo: { type: String },
    // LRNNo: { type: String, required: true },
    //studentFirstName: { type: string, required: true },
    //studentMiddleName: { type: string, required: true },
    //studentLastName: { type: string, required: true },
    birthDate: { type: String, required: true },
    gender: { type: String, required: true },
    indig: { type: Boolean, required: true },
    indigSpec: { type: String },
    motherTongue: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String, required: true },
    zipCode: { type: Number, required: true },
    //email: { type: string, unique: true, required: true },
    //phoneNum: { type: number },

    //parent/guardian
    motherFirstName: { type: String, required: true },
    motherMiddleName: { type: String, required: true },
    motherLastName: { type: String, required: true },
    fatherFirstName: { type: String, required: true },
    fatherMiddleName: { type: String, required: true },
    fatherLastName: { type: String, required: true },
    guardianFirstName: { type: String, required: true },
    guardianMiddleName: { type: String, required: true },
    guardianLastName: { type: String, required: true },
    emergencyName: { type: String },
    emergencyCellphone: { type: Number },
    emergencyTelephone: { type: Number },
    parentEmail: { type: String, unique: true, required: true },
    parentPhoneNum: { type: Number },

    //for returning students
    lastGradeLevel: { type: String },
    lastSchoolYear: { type: String },
    schoolName: { type: String },
    schoolAddress: { type: String },

    //for shs students
    semester: { type: String },
    track: { type: String },
    strand: { type: String }, 

    //prefered learning modes
    modularP: { type: Boolean },
    modularD: { type: Boolean },
    online: { type: Boolean },
    educTV: { type: Boolean },
    radioBased: { type: Boolean },
    homeschool: { type: Boolean },
    blended: { type: Boolean },
    facetoface: { type: Boolean }

});

module.exports = mongoose.model('StudentInfo', StudentInfoSchema)