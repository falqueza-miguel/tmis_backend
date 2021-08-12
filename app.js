//dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const cors = require('cors');

const app = express();

//middleware (ease of life)
app.use(bodyParser.json()); //application/json, parses incoming json data
app.use(bodyParser.urlencoded({extended: true})); //x-www-form-urlencoded, not sure wtf extended is for
app.use(cors());

//cors, test this first then install npm cors
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, PATCH, DELETE');
//     res.setHeader('Access-Control-Allow-Heathers', 'Content-Type, Authorization');
//     next();
// })

//connecting app to routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

app.use(authRoutes); //"use" keyword is for all type of requests, "get" n others match path exactly
app.use(adminRoutes);

//404 probably best to put this in some route
app.use((req, res) => {
    res.status(404).send('<h1>error 404</h1>');
});

//connect to database and fires up server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true , useUnifiedTopology: true })
.then(result => {
    console.log('connected to database!');
    app.listen(3000); //request listener, only fires when successfully connected to database
}).catch(err => {
    console.log(err);
});

