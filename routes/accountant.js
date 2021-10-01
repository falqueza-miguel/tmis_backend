const router = require('express').Router();
const nodemailer = require('nodemailer');
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 
const client = require('twilio')(accountSid, authToken); 

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SRV,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PW
    }
});

const User = require('../models/user');
const Balance = require('../models/balance');
const Payinfo = require('../models/payinfo');

const isAuth = require('../middleware/is-auth');
const { isAccountant } = require('../middleware/is-role')
const USERS_PER_PAGE = 1000;

//user profile page
router.get('/accountant', isAuth, isAccountant, async (req, res) => {
    try {
        let user = await User.findOne({ _id: res.locals._id });
        res.json({
            success: true,
            user: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//edit payment information

//get all students
router.get('/accountant/students', isAuth, isAccountant, async (req, res) => {
    try {
        const page = req.query.page;
        let totalUsers = await User.find( {role: 6} ).count();
        let users = await User.find( {role: 6} ).skip((page-1)*USERS_PER_PAGE).limit(USERS_PER_PAGE);;
        res.json({
            success: true,
            users: users,
            totalUsers: totalUsers,
            hasNextPage: USERS_PER_PAGE * page < totalUsers,
            hasPreviousPage: page > 1,
            nextPage: parseInt(page) + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalUsers/USERS_PER_PAGE)
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get one student and list balances
router.get('/accountant/students/:id', isAuth, isAccountant, async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.params.id });
        let balances = await Balance.find({ student: req.params.id }).sort({ createdAt: -1 })
        //get balance id's probably and create a link with the id (no need to send the whole balance object in the json)
        res.json({
            success: true,
            user: user,
            balances: balances
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//new balance
router.post('/accountant/students/:id/newbalance', isAuth, isAccountant, async (req, res) => {
    try {
        let balance = new Balance({
            schoolYearFrom : req.body.schoolYearFrom,
            schoolYearTo : req.body.schoolYearTo,
            yearLevel : req.body.yearLevel,
            semester : req.body.semester,
        
            student : req.params.id, //student _id
        
            paymentTerms: req.body.paymentTerms,
            modeOfPayment: req.body.modeOfPayment
        
        });
        await balance.save();
        res.json({
            success: true,
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get balance
router.get('/accountant/students/:id/:balanceID', isAuth, isAccountant, async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.params.id });
        let balance = await Balance.findOne({$and: [{ _id: req.params.balanceID }, { student: user._id }]});
        let bal = 0

    var balanceObject = balance.toObject()
    let runBalance = []
    for (i in balance.transactionType) {
    bal = (bal + balance.debit[i]) - balance.credit[i]
    runBalance.push(bal)
    }
    balanceObject.runBalance = runBalance

    let payment = 0
    let scheduleAmount = []
    let schedulePeriod = []
    if (balanceObject.paymentTerms.toUpperCase() == "YEARLY"){
        for (i in balanceObject.transactionType){
            if (balanceObject.transactionType[i] == "TUITION" && balanceObject.debit[i] > 0){
                payment = payment + balanceObject.debit[i]
            }
        }
        scheduleAmount.push(payment)
        schedulePeriod.push("Y1")
    } else if (balanceObject.paymentTerms.toUpperCase() == "QUARTERLY"){
        for (i in balanceObject.transactionType){
            if (balanceObject.transactionType[i] == "TUITION" && balanceObject.debit[i] > 0){
                payment = payment + balanceObject.debit[i]
            }
        }
        payment = payment / 4
        for (let i = 0; i < 4; i++) {
            let shift = parseFloat(i) + parseFloat(1)
            scheduleAmount.push(payment)
            schedulePeriod.push("Q"+shift)
        }
    } else if (balanceObject.paymentTerms.toUpperCase() == "MONTHLY"){
        for (i in balanceObject.transactionType){
            if (balanceObject.transactionType[i] == "TUITION" && balanceObject.debit[i] > 0){
                payment = payment + balanceObject.debit[i]
            }
        }
        payment = payment / 10
        for (let i = 0; i < 10; i++) {
            let shift = parseFloat(i) + parseFloat(1)
            scheduleAmount.push(payment)
            schedulePeriod.push("M"+shift)
        }
    }
    balanceObject.scheduleAmount = scheduleAmount
    balanceObject.schedulePeriod = schedulePeriod

        res.json({
            success: true,
            user: user,
            balance: balanceObject,
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//add transaction
router.post('/accountant/students/:id/:balanceID', isAuth, isAccountant, async (req, res) => {
    try {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        let user = await User.findOne({ _id: req.params.id });
        let userParent = await User.findOne({ student_id: req.params.id })
        let balance = await Balance.findOneAndUpdate(
            { $and: [{ _id: req.params.balanceID }, { student: user._id }] },
            { $push: {
                transactionDate: today.toLocaleDateString(),
                transactionType: req.body.transactionType.toUpperCase(),
                debit: req.body.debit,
                credit: req.body.credit }},
            { new: true });

        if (req.body.asEmail){
        var balanceEncodedEmail = {
            from: process.env.EMAIL,
            to: userParent.email,
            subject: "TMIS balance notification!",
            html: "<h1>happy new year you filthy animal</h1>" + userParent.firstName + " " + userParent.middleName + " " + userParent.lastName 
        };
    
        transporter.sendMail(balanceEncodedEmail);
        }

        if (req.body.asSMS){
        client.messages 
        .create({ 
            body: 'Tierra Monte Integrated School notification. Your balance has been updated, please check <link here>',  // change this
            messagingServiceSid: process.env.TWILIO_SERV_SID,      
            to: '+63' + userParent.phoneNum 
        }) 
        .then(message => console.log(message.sid))
        .catch(err => {
            console.log(err);
        });
        }

        res.json({
            success: true,
            user: user,
            balance: balance
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//delete balance (like actually delete)
router.delete('/accountant/:id/:balanceID', isAuth, isAccountant, async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.params.id });
        let balance = await Balance.findOneAndDelete({$and: [{ _id: req.params.balanceID }, { student: user._id }]});
        res.json({
            success: true,
            balance: balance
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

//payment information

//create payinfo
router.post('/accountant/createpayinfo', isAuth, isAccountant, async (req, res) => {
    try {
        let payinfo = new Payinfo({
            title: req.body.title,
            content: req.body.content
        });
        await payinfo.save();
        res.json({
            success: true,
            payinfo: payinfo
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }   
});

//get all payinfo
router.get('/accountant/payinfo', isAuth, isAccountant, async (req, res) => {
    try {
        let payinfo = await Payinfo.find().sort({ createdAt: -1})
        res.json({
            success: true,
            payinfo: payinfo,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get one payinfo
router.get('/accountant/payinfo/:id', isAuth, isAccountant, async (req, res) => {
    try {
        let payinfo = await Payinfo.findOne({ _id: req.params.id });
        res.json({
            success: true,
            payinfo: payinfo
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

//edit payinfo
router.put('/accountant/payinfo/:id', isAuth, isAccountant, async (req, res) => {
    try {
        console.log('trying to update!');
        let payinfo = await Payinfo.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { 
            title: req.body.title,
            content: req.body.content }},
        { new: true });
        res.json({
            success: true,
            payinfo: payinfo
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

//delete payinfo (like actually delete)
router.delete('/accountant/payinfo/:id', isAuth, isAccountant, async (req, res) => {
    try {
        console.log("hi")
        let payinfo = await Payinfo.findOneAndDelete( {_id: req.params.id });
        res.json({
            success: true,
            payinfo: payinfo
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

module.exports = router;