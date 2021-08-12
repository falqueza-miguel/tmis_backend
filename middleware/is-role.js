exports.isAdmin = (req, res, next) => {
	if (!res.locals.role == 0) {
        console.log ('invalid role!');
		return res.status(403).json({
			error: "Admin Only. Access Denied",
		});
	}
	next();
};