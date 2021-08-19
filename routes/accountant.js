const router = require('express').Router();

const User = require('../models/user');
const Balance = require('../models/balance');

const isAuth = require('../middleware/is-auth');
const { isAccountant } = require('../middleware/is-role')

//edit payment information

//get all (active?) students
router.get('/accountant/students', isAuth, isAccountant, async (req, res) => {
    try {
        let users = await User.find( {role: 6} );
        res.json({
            success: true,
            users: users
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
        let balance = await Balance.findOneAndUpdate(
            { $and: [{ _id: req.params.balanceID }, { student: user._id }] },
            { $push: {
                transactionDate: today.toLocaleDateString(),
                transactionType: req.body.transactionType,
                debit: req.body.debit,
                credit: req.body.credit }},
            { new: true });
        //compute in frontend
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