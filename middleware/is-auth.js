const jwt = require('jsonwebtoken'); //is logged in?

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader){
        const error = new Error('not Authenticated.');
        console.log('no authorization header!');// not logged in
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try{
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        err.statusCode = 500;
        console.log('modified token!')
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('not authenticated!');
        console.log('no bearer token!');
        error.statusCode = 401;
        throw error
    }
    res.locals._id = decodedToken._id; // ALL THESE REACH ROUTES
    res.locals.email = decodedToken.email; // email might not be used
    res.locals.role = decodedToken.role;
    console.log('user logged in!');
    next();
}

//middlewares dont need semicolons?