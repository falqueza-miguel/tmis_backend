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

const isAuth = require('../middleware/is-auth');
const { isAccountant } = require('../middleware/is-role')
const USERS_PER_PAGE = 2;

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
        let balances = await Balance.find({ student: req.params.id })
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
        let balance = await Balance.find({$and: [{ _id: req.params.balanceID }, { student: user._id }]});
        res.json({
            success: true,
            user: user,
            balance: balance //compute in frontend
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
                transactionType: req.body.transactionType,
                debit: req.body.debit,
                credit: req.body.credit }},
            { new: true });

    
        var balanceEncodedEmail = {
            from: process.env.EMAIL,
            to: userParent.email,
            subject: "TMIS balance notification!",
            html: "<h1>happy new year you filthy animal</h1>" + userParent.firstName + " " + userParent.middleName + " " + userParent.lastName 
        };
    
        transporter.sendMail(balanceEncodedEmail);

        client.messages 
        .create({ 
            body: 'test! again! -miguel',  // change this
            messagingServiceSid: process.env.TWILIO_SERV_SID,      
            to: '+63' + userParent.phoneNum 
        }) 
        .then(message => console.log(message.sid))
        .catch(err => {
            console.log(err);
        });

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

module.exports = router;