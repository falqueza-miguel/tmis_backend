//PREREGFORM SHORTER CODE BUT NOT SURE IF WORKS
router.post('/prereg', (req, res) => {
    const prereg = new Prereg({
        schoolYear: req.body.schoolYear,
        levelEnroll: req.body.levelEnroll,
        hasLRN: req.body.hasLRN,
        returning: req.body.returning,
    
        //student
        PSANo: req.body.PSANo,
        LRNNo: req.body.LRNNo,
        studentFirstName: req.body.studentFirstName,
        studentMiddleName: req.body.studentMiddleName,
        studentLastName: req.body.studentLastName,
        birthDate: req.body.birthDate,
        gender: req.body.gender,
        indig: req.body.indig,
        indigSpec: req.body.indigSpec,
        motherTongue: req.body.motherTongue,
        address1: req.body.address1,
        address2: req.body.address2,
        zipCode: req.body.zipCode,
        email: req.body.email,
        phoneNum: req.body.phoneNum,
    
        //parent/guardian
        motherFirstName: req.body.motherFirstName,
        motherMiddleName: req.body.motherMiddleName,
        motherLastName: req.body.motherLastName,
        fatherFirstName: req.body.fatherFirstName,
        fatherMiddleName: req.body.fatherMiddleName,
        fatherLastName: req.body.fatherLastName,
        guardianFirstName: req.body.guardianFirstName,
        guardianMiddleName: req.body.guardianMiddleName,
        guardianLastName: req.body.guardianLastName,
        parentEmail: req.body.parentEmail,
        parentPhoneNum: req.body.parentPhoneNum,
    
        //for returning students
        lastGradeLevel: req.body.lastGradeLevel,
        lastSchoolYear: req.body.lastSchoolYear,
        schoolName: req.body.schoolName,
        schoolAddress: req.body.schoolAddress,
    
        //for shs students
        semester: req.body.semester,
        track: req.body.track,
        strand: req.body.strand, 
    
        //prefered learning modes
        modularP: req.body.modularP,
        modularD: req.body.modularD,
        online: req.body.online,
        educTV: req.body.educTV,
        radioBased: req.body.radioBased,
        homeschool: req.body.homeschool,
        blended: req.body.blended,
        facetoface: req.body.facetoface
    
    });
    prereg.save()
    .then(result => {
        console.log('prereg created, database connection successful, check mongo atlas');
        res.send('<h1>prereg created!</h1>');
    })
    .catch(err => {
        console.log(err);
    })
});