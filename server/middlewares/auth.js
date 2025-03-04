const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.user || req.session.user.nivelAcceso !== 1) {
        return res.redirect('/');
    }
    next();
};

const requireRole = (nivelAcceso) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user || req.session.user.nivelAcceso > nivelAcceso) {
            return res.redirect('/');
        }
        next();
    };
};

const requireArea = (areaId) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user || req.session.user.idArea !== areaId) {
            return res.redirect('/');
        }
        next();
    };
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireRole,
    requireArea
};
