const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentInfoSchema = new Schema({
  
    user: { type: Schema.Types.ObjectId, ref: 'User' , required: true }, //need ata dbref?

    schoolYear: { type: string, required: true },
    levelEnroll: { type: string, required: true },
    hasLRN: { type: boolean, required: true },
    returning: { type: boolean, required: true },

    //student number (given after registration)
    studentNo: { type: string, required: true },

    //student
    PSANo: { type: string },
    LRNNo: { type: string },
    //studentFirstName: { type: string, required: true },
    //studentMiddleName: { type: string, required: true },
    //studentLastName: { type: string, required: true },
    birthDate: { type: string, required: true },
    gender: { type: string, required: true },
    indig: { type: boolean, required: true },
    indigSpec: { type: string },
    motherTongue: { type: string, required: true },
    address1: { type: string, required: true },
    address2: { type: string, required: true },
    zipCode: { type: number, required: true },
    //email: { type: string, unique: true, required: true },
    //phoneNum: { type: number },

    //parent/guardian
    motherFirstName: { type: string, required: true },
    motherMiddleName: { type: string, required: true },
    motherLastName: { type: string, required: true },
    fatherFirstName: { type: string, required: true },
    fatherMiddleName: { type: string, required: true },
    fatherLastName: { type: string, required: true },
    guardianFirstName: { type: string, required: true },
    guardianMiddleName: { type: string, required: true },
    guardianLastName: { type: string, required: true },
    //parentEmail: { type: string, unique: true, required: true },
    //parentPhoneNum: { type: number },

    //for returning students
    lastGradeLevel: { type: string },
    lastSchoolYear: { type: string },
    schoolName: { type: string },
    schoolAddress: { type: string },

    //for shs students
    semester: { type: string },
    track: { type: string },
    strand: { type: string }, 

    //prefered learning modes
    modularP: { type: boolean },
    modulard: { type: boolean },
    online: { type: boolean },
    educTV: { type: boolean },
    radioBased: { type: boolean },
    homeschool: { type: boolean },
    blended: { type: boolean },
    facetoface: { type: boolean }

});

module.exports = mongoose.model('StudentInfo', StudentInfoSchema)