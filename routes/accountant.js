const router = require('express').Router();
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 
const client = require('twilio')(accountSid, authToken); 

const User = require('../models/user');
const Balance = require('../models/balance');
const Payinfo = require('../models/payinfo');
const Tuition = require('../models/tuition');

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
        let tuition = await Tuition.findOne({ tuition: true });
        let userParent = await User.findOne({ student_id: req.params.id })
        console.log(tuition);
        let tuit = 0
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        yearLevel = req.body.yearLevel
        //check grade level
        //add tuition to balance
        console.log(yearLevel);

        if (yearLevel == 7){
            tuit = tuition.grade7;
        } else if (yearLevel == 8){
            tuit = tuition.grade8;
        } else if (yearLevel == 9){
            tuit = tuition.grade9;
        } else if (yearLevel == 10){
            tuit = tuition.grade10;
        } else if (yearLevel == 11){
            tuit = tuition.grade11;
        } else if (yearLevel == 12){
            tuit = tuition.grade12;
        }

        console.log(tuit);
        let transacDate = [];
        let transacType = [];
        let de = [];
        let cr = [];
        
        //check if an existing balance exists
        let prevBal = await Balance.findOne({ student: req.params.id }).sort({ createdAt: -1 })
        console.log(prevBal);
        console.log(prevBal !== null);
        //compute running balance of prev
        if (prevBal !== null) {
            console.log("hi");
            let bal = 0;
            let runBalance = [];
            for (i in prevBal.transactionType) {
                console.log(i)
                bal = (bal + prevBal.debit[i]) - prevBal.credit[i]
                runBalance.push(bal)
            }
            console.log(prevBal.transactionDate[prevBal.transactionDate.length - 1]);
            //add old balance to new (BEG BAL)
            transacDate.push(prevBal.transactionDate[prevBal.transactionDate.length - 1]);
            transacType.push("BEG BAL");
            de.push(runBalance[runBalance.length - 1]);
            cr.push(0);
        }
        console.log("1");
        transacDate.push(today.toLocaleDateString());
        transacType.push("TUITION");
        de.push(tuit);
        cr.push(0);
        console.log("2");
        
        let blank = "";
        let paid = [];
        let paidWhen = [];
        if (req.body.paymentTerms.toUpperCase() == "YEARLY"){
            paid.push(false);
            paidWhen.push(blank);
        } else if (req.body.paymentTerms.toUpperCase() == "QUARTERLY"){
            for (let i = 0; i < 4; i++) {
                paid.push(false);
                paidWhen.push(blank);
            }
        } else if (req.body.paymentTerms.toUpperCase() == "MONTHLY"){
            for (let i = 0; i < 10; i++) {
                paid.push(false);
                paidWhen.push(blank);
            }
        }
        let terms = req.body.paymentTerms.toUpperCase()
        
        let balance = new Balance({
            schoolYearFrom : req.body.schoolYearFrom,
            schoolYearTo : req.body.schoolYearTo,
            yearLevel : yearLevel,
            semester : req.body.semester,
        
            student : req.params.id, //student _id
        
            paymentTerms: terms,
            modeOfPayment: req.body.modeOfPayment,
        
            transactionDate: transacDate,
            transactionType: transacType,
            debit: de,
            credit: cr,

            paid: paid,
            paidWhen: paidWhen
        });
        console.log(balance)
        // await balance.save();
        console.log("3");

        var balanceObject = balance.toObject()

        let now = new Date()
        let year = now.getUTCFullYear();
        let month = now.getUTCMonth();
        let date = now.getUTCDate();
        console.log(year);
        console.log(month);
        console.log(date);
        console.log(now);
        // now.setMonth(now.getMonth()+1);
        // year = now.getUTCFullYear();
        // month = now.getUTCMonth();
        // date = now.getUTCDate();
        // console.log(now)
        // console.log(year);
        // console.log(month);
        // console.log(date);

        let emailString = ""
        let payment = 0
        let scheduleAmount = []
        let schedulePeriod = []
        let emailSched = []
        if (terms == "YEARLY"){
            for (i in balanceObject.transactionType){
                if (balanceObject.transactionType[i] == "TUITION" && balanceObject.debit[i] > 0){
                    payment = payment + balanceObject.debit[i]
                }
            }
            emailString = emailString + "Payment 1: P" + payment + "<br>"
            scheduleAmount.push(payment)
            schedulePeriod.push("Y1")
            balance.emailSched = [now]
            balance.emailSent = [true];
            balance.emailDone = true;
        } else if (terms == "QUARTERLY"){
            for (i in balanceObject.transactionType){
                if (balanceObject.transactionType[i] == "TUITION" && balanceObject.debit[i] > 0){
                    payment = payment + balanceObject.debit[i]
                }
            }
            payment = payment / 4
            for (let i = 0; i < 4; i++) {
                let shift = parseFloat(i) + parseFloat(1)
                emailString = emailString + "Payment " + shift + ": P" + payment + "<br>"
                scheduleAmount.push(payment)
                schedulePeriod.push("Q"+shift)
            }
            let now = new Date();
            emailSched.push(now);
            for (let i = 0; i < 3; i++){
                let now = new Date();
                let q = (i+1)*3;
                console.log(q);
                now.setMonth(now.getMonth()+q);
                console.log(now)
                emailSched.push(now);
            }
            balance.emailSent = [true, false, false, false];
            balance.emailDone = false;
            balance.emailSched = emailSched
        } else if (terms == "MONTHLY"){
            for (i in balanceObject.transactionType){
                if (balanceObject.transactionType[i] == "TUITION" && balanceObject.debit[i] > 0){
                    payment = payment + balanceObject.debit[i]
                }
            }
            payment = payment / 10
            for (let i = 0; i < 10; i++) {
                let shift = parseFloat(i) + parseFloat(1)
                emailString = emailString + "Payment " + shift + ": P" + payment + "<br>"
                scheduleAmount.push(payment)
                schedulePeriod.push("M"+shift)
            }
            let now = new Date();
            emailSched.push(now);
            for (let i = 0; i < 9; i++){
                let now = new Date();
                let m = i+1;
                console.log(m);
                now.setMonth(now.getMonth()+m);
                console.log(now)
                emailSched.push(now);
            }
            balance.emailSent = [true, false, false, false, false, false, false, false, false, false];
            balance.emailDone = false;
            balance.emailSched = emailSched;
        }
        balanceObject.scheduleAmount = scheduleAmount
        balanceObject.schedulePeriod = schedulePeriod
        console.log(balance)
        console.log(emailString)

        await balance.save();

        const oauth2Client = new OAuth2(
            process.env.CLIENT_ID, // ClientID
            process.env.CLIENT_SECRET, // Client Secret
            "https://developers.google.com/oauthplayground" // Redirect URL
        );
        
        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN
        });
        const accessToken = oauth2Client.getAccessToken()

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SRV,
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken
            },
            tls: {
                rejectUnauthorized: false
              }
        });
        
        var balanceEncodedEmail = {
            from: process.env.EMAIL,
            to: userParent.email,
            subject: "TMIS Balance Encoded notification!",
            html: "Your balance has been encoded, you may view our payment information by logging in our website "+'<a href="' + process.env.WEBSITE  +'">here</a>' + ".<br><br>Payment Schedule:<br>"+emailString
        };

        var paymentNoticeEmail = {
            from: process.env.EMAIL,
            to: userParent.email,
            subject: "TMIS payment notice notification!",
            html: "You are almost due for payment!, you may view your balance details and our payment information by logging in our website "+'<a href="' + process.env.WEBSITE  +'">here</a>' + "."
        };
    
        transporter.sendMail(balanceEncodedEmail);
        transporter.sendMail(paymentNoticeEmail);

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
    console.log(balanceObject)

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

        const oauth2Client = new OAuth2(
            process.env.CLIENT_ID, // ClientID
            process.env.CLIENT_SECRET, // Client Secret
            "https://developers.google.com/oauthplayground" // Redirect URL
        );
            
        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN
        });
        const accessToken = oauth2Client.getAccessToken()

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SRV,
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken
            },
            tls: {
                rejectUnauthorized: false
              }
        });
        
        var balanceEncodedEmail = {
            from: process.env.EMAIL,
            to: userParent.email,
            subject: "TMIS balance notification!",
            html: "Your balance has been updated, you may view it by logging in our website "+'<a href="' + process.env.WEBSITE  +'">here</a>' + "."
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

//edit transaction
router.post('/accountant/editTransaction/:id/:balanceID', isAuth, isAccountant, async (req, res) => {
    try {
        let index = req.body.index;
        let user = await User.findOne({ _id: req.params.id });
        let balance = await Balance.findOne({$and: [{ _id: req.params.balanceID }, { student: user._id }]});
        balance.transactionType.splice(index, 1, req.body.transacType);
        balance.debit.splice(index, 1, req.body.debit);
        balance.credit.splice(index, 1, req.body.credit);
        await balance.save();
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

//delete transaction (like actually delete)
router.post('/accountant/delTransaction/:id/:balanceID', isAuth, isAccountant, async (req, res) => {
    try {
        let index = req.body.index;
        let user = await User.findOne({ _id: req.params.id });
        let balance = await Balance.findOne({$and: [{ _id: req.params.balanceID }, { student: user._id }]});
        balance.transactionDate.splice(index, 1);
        balance.transactionType.splice(index, 1);
        balance.debit.splice(index, 1);
        balance.credit.splice(index, 1);
        await balance.save();
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

//update schedule
router.put('/accountant/updateSched/:id/:balanceID', isAuth, isAccountant, async (req, res) => {
    try {
        let balance = await Balance.findOneAndUpdate(
            {$and: [{ _id: req.params.balanceID }, { student: user._id }]},
            { $set: { 
                paid: req.body.paid,
                paidWhen: req.body.paidWhen }},
            { new: true });
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
router.get('/accountant/delete/:id', isAuth, isAccountant, async (req, res) => {
    try {
        console.log("hi")
        console.log(req.params.id)
        let payinfo = await Payinfo.findOneAndDelete({ _id: req.params.id });
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

//get tuition
router.get('/accountant/tuition', isAuth, isAccountant, async (req, res) => {
    try {
        let tuition = await Tuition.findOne({ tuition: true });
        res.json({
            success: true,
            tuition: tuition
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

//update tuition
router.post('/accountant/tuitionUpdate', isAuth, isAccountant, async (req, res) => {
    try {
        let tuition = await Tuition.findOneAndUpdate(
            { tuition: true },
            { $set: {
                grade7: req.body.grade7,
                grade8: req.body.grade8,
                grade9: req.body.grade9,
                grade10: req.body.grade10,
                grade11: req.body.grade11,
                grade12: req.body.grade12 }},
            { new: true });
        res.json({
            success: true,
            tuition: tuition
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }    
});

//simulate node-cron
router.get('/accountant/simulate', isAuth, isAccountant, async (req, res) => {
    try {
        console.log('running a task every day at 1 am');
        let today = new Date();
        let balance = await Balance.find({emailDone: false})
        for (i in balance){
            for (j in balance[i].emailSent){
                if (balance[i].emailSent[j] == false){
                    console.log(balance[i].emailSched[j]);
                    let sched = new Date(balance[i].emailSched[j]);
                    if (sched.toDateString()==today.toDateString()){
                        const oauth2Client = new OAuth2(
                            process.env.CLIENT_ID, // ClientID
                            process.env.CLIENT_SECRET, // Client Secret
                            "https://developers.google.com/oauthplayground" // Redirect URL
                        );
                        
                        oauth2Client.setCredentials({
                            refresh_token: process.env.REFRESH_TOKEN
                        });
                        const accessToken = oauth2Client.getAccessToken()
                
                        const transporter = nodemailer.createTransport({
                            service: process.env.EMAIL_SRV,
                            auth: {
                                type: "OAuth2",
                                user: process.env.EMAIL,
                                clientId: process.env.CLIENT_ID,
                                clientSecret: process.env.CLIENT_SECRET,
                                refreshToken: process.env.REFRESH_TOKEN,
                                accessToken: accessToken
                            },
                            tls: {
                                rejectUnauthorized: false
                              }
                        });
                        let userParent = await User.findOne({ student_id: balance[i].student })
                        var paymentNoticeEmail = {
                            from: process.env.EMAIL,
                            to: userParent.email,
                            subject: "TMIS payment notice notification!",
                            html: "You are almost due for payment!, you may view your balance details and our payment information by logging in our website "+'<a href="' + process.env.WEBSITE  +'">here</a>' + "."
                        };
                        console.log(userParent.email)
                        transporter.sendMail(paymentNoticeEmail);
                        balance[i].emailSent[j] = true;
                        let sent = balance[i].emailSent
                        let done = false;
                        console.log(balance[i].emailSent)
                        let check = balance[i].emailSent[balance[i].emailSent.length - 1]
                        console.log(check)
                        if (check==true){
                            done = true;
                        }
                        await Balance.findOneAndUpdate(
                            { _id: balance[i]._id }, 
                            { $set: { 
                                emailSent: sent,
                                emailDone: done
                            }},
                            { new: true });
                    }
                    break;
                }
    
            }
        }
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
module.exports = router;