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

exports.isPrincipal = (req, res, next) => {
    if (!(res.locals.role == 1)) {
        console.log ('not principal!');
		return res.status(403).json({
			error: "Principal Only. Access Denied",
		});
	}
    console.log('user is principal!');
	next();
};

exports.isAccountant = (req, res, next) => {
    if (!(res.locals.role == 2)) {
        console.log ('not accountant!');
		return res.status(403).json({
			error: "Accountant Only. Access Denied",
		});
	}
    console.log('user is accountant!');
	next();
};

exports.isRegistrar = (req, res, next) => {
    if (!(res.locals.role == 3)) {
        console.log ('not registrar!');
		return res.status(403).json({
			error: "Registrar Only. Access Denied",
		});
	}
    console.log('user is registrar!');
	next();
};

exports.isTeacher = (req, res, next) => {
    if (!(res.locals.role == 4)) {
        console.log ('not teacher!');
		return res.status(403).json({
			error: "Teacher Only. Access Denied",
		});
	}
    console.log('user is teacher!');
	next();
};

exports.isParent = (req, res, next) => {
    if (!(res.locals.role == 5)) {
        console.log ('not parent!');
		return res.status(403).json({
			error: "Parent Only. Access Denied",
		});
	}
    console.log('user is parent!');
	next();
};

exports.isStudent = (req, res, next) => {
    if (!(res.locals.role == 6)) {
        console.log ('not student!');
		return res.status(403).json({
			error: "Student Only. Access Denied",
		});
	}
    console.log('user is student!');
	next();
};