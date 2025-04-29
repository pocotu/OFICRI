const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'login', 'logout', 'download']
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    metadata: {
        type: Object
    }
}, {
    timestamps: true
});

// Índices para mejorar el rendimiento de las consultas
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1 });
activitySchema.index({ document: 1 });

module.exports = mongoose.model('Activity', activitySchema); 