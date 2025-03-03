const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.user || req.session.user.nivelAcceso !== 1) {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
};

const requireRole = (nivelAcceso) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user || req.session.user.nivelAcceso > nivelAcceso) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        next();
    };
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireRole
};
