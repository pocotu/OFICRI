const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/index.html');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.user || req.session.user.nivelAcceso !== 1) {
        return res.redirect('/index.html');
    }
    next();
};

module.exports = {
    requireAuth,
    requireAdmin
};
