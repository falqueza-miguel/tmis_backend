const jwt = require('jsonwebtoken'); //is logged in?

module.exports = (req, res, next) => {
    const token = req.cookies.token;
    console.log(token);
    // if (!authHeader){
    //     const error = new Error('not Authenticated.');
    //     console.log('no authorization header!');// not logged in
    //     error.statusCode = 401;
    //     throw error;
    // }
    let decodedToken;
    try{
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        err.statusCode = 500;
        console.log('modified or nonexistent token!')
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('not authenticated!');
        console.log('no token!');
        error.statusCode = 401;
        throw error
    }
    res.locals._id = decodedToken._id; // ALL THESE REACH ROUTES
    res.locals.email = decodedToken.email; // email used for teacherroutes
    res.locals.role = decodedToken.role;
    console.log('user logged in!');
    next();
}

//middlewares dont need semicolons?