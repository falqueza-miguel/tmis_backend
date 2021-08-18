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
        //FINALIZE BALANCE MODEL
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
        let balance = await Balance.find({ student: req.params.balanceID })
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

//add transaction

module.exports = router;