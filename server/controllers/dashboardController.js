const Activity = require('../models/Activity');
const Document = require('../models/Document');
const User = require('../models/User');

/**
 * Obtiene las estadísticas generales del dashboard
 */
exports.getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalDocuments,
            recentActivity,
            pendingDocuments
        ] = await Promise.all([
            User.countDocuments(),
            Document.countDocuments(),
            Activity.find().sort('-createdAt').limit(5),
            Document.countDocuments({ status: 'pending' })
        ]);

        res.json({
            totalUsers,
            totalDocuments,
            recentActivity,
            pendingDocuments
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

/**
 * Obtiene la actividad reciente del sistema
 */
exports.getActivity = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [activities, total] = await Promise.all([
            Activity.find()
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .populate('user', 'name email')
                .populate('document', 'title'),
            Activity.countDocuments()
        ]);

        res.json({
            activities,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener actividad', error: error.message });
    }
};

/**
 * Obtiene los documentos pendientes
 */
exports.getPendingDocuments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [documents, total] = await Promise.all([
            Document.find({ status: 'pending' })
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .populate('creator', 'name email'),
            Document.countDocuments({ status: 'pending' })
        ]);

        res.json({
            documents,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener documentos pendientes', error: error.message });
    }
}; 