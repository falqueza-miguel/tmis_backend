//dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const cookieParser = require("cookie-parser");
const cors = require('cors');
const jwt = require('express-jwt');

const app = express();

//middleware (ease of life)
app.use(bodyParser.json()); //application/json, parses incoming json data
app.use(bodyParser.urlencoded({extended: true})); //x-www-form-urlencoded, para san extended?
app.use(cookieParser());
app.use(cors({ origin:true, credentials:true }));

//connecting app to routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const principalRoutes = require('./routes/principal');
const accountantRoutes = require('./routes/accountant');
const registrarRoutes = require('./routes/registrar');
const teacherRoutes = require('./routes/teacher');
const parent_studentRoutes = require('./routes/parent_student');

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

//connect to database and fires up server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true , useUnifiedTopology: true })
.then(result => {
    console.log('connected to database!');
    app.listen(4000); //request listener, only fires when successfully connected to database
}).catch(err => {
    console.log(err);
});

