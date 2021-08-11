const jwt = require('jsonwebtoken'); //is logged in?

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader){
        const error = new Error('Not Authenticated.');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try{
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('not authenticated!'); //not logged in
        error.statusCode = 401;
        throw error
    }
    req._id = decodedToken._id;
    req.email = decodedToken.email;
    req.role = decodedToken.role;
    console.log(decodedToken);
    next();
}