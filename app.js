//dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const cookieParser = require("cookie-parser");
const cors = require('cors');
const jwt = require('express-jwt');
var session = require('express-session');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();

//middleware (ease of life)
app.use(bodyParser.json()); //application/json, parses incoming json data
app.use(bodyParser.urlencoded({extended: true})); //x-www-form-urlencoded, para san extended?
app.use(cookieParser());
app.use(cors({ origin:true, credentials:true }));
app.enable('trust proxy', 1);
app.use(session({
    secret: 'secret',
    proxy: true,
    // cookie: {
    //     sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // must be 'none' to enable cross-site delivery
    //     secure: process.env.NODE_ENV === "production", // must be true if sameSite='none'
    //   }
}));

//connecting app to routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const principalRoutes = require('./routes/principal');
const accountantRoutes = require('./routes/accountant');
const registrarRoutes = require('./routes/registrar');
const teacherRoutes = require('./routes/teacher');
const parent_studentRoutes = require('./routes/parent_student');
const Balance = require('./models/balance');

//turn into app.use('/api', sampleRoutes);
app.use('/api', authRoutes); //"use" keyword is for all type of requests, "get" n others match path exactly
app.use('/api', adminRoutes);
app.use('/api', principalRoutes);
app.use('/api', accountantRoutes);
app.use('/api', registrarRoutes);
app.use('/api', teacherRoutes);
app.use('/api', parent_studentRoutes);

//404 probably best to put this in some route
app.use((req, res) => {
    res.status(404).send('<h1>error 404</h1>');
});

//node-cron scanner
cron.schedule('* 1 * * *', async function() {
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
});

//connect to database and fires up server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true , useUnifiedTopology: true })
.then(result => {
    console.log('connected to database!');
    app.listen(process.env.PORT); //request listener, only fires when successfully connected to database
}).catch(err => {
    console.log(err);
});