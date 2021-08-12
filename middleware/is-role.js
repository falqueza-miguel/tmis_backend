exports.isAdmin = (req, res, next) => {
	if (!(res.locals.role == 0)) {
        console.log ('not admin!');
		return res.status(403).json({
			error: "Admin Only. Access Denied",
		});
	}
    console.log('user is admin!');
	next();
};

exports.isPrincipal = (req, res, next) => { //bugged can be accessed by teachers'
    if (!(res.locals.role == 1)) {
        console.log ('not principal!');
		return res.status(403).json({
			error: "Principal Only. Access Denied",
		});
	}
    console.log('user is principal!');
	next();
};