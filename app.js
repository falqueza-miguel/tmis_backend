//dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

//middleware (ease of life)
app.use(bodyParser.urlencoded({extended: true})); //not sure wtf extended is for

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
mongoose.connect('mongodb+srv://tmis_connection:1KtH1OKL8VH8V6Vo@development.lkjit.mongodb.net/tmis_database?retryWrites=true&w=majority',{ 
useNewUrlParser: true , useUnifiedTopology: true 
}).then(result => {
    console.log('connected to database!');
    app.listen(3000); //request listener, only fires when successfully connected to database
}).catch(err => {
    console.log(err);
});

