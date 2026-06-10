const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    action:    { type: String, required: true },   // ex: "LOGIN", "REGISTER", "ADD_FORMATION"
    category:  {
        type: String,
        enum: ['AUTH', 'USER', 'FORMATION', 'CENTRE', 'INSCRIPTION', 'BADGE', 'SYSTEM'],
        default: 'SYSTEM'
    },
    level:     { type: String, enum: ['INFO', 'WARNING', 'ERROR'], default: 'INFO' },
    status:    { type: String, enum: ['SUCCESS', 'FAILED', 'BLOCKED'], default: 'SUCCESS' },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName:  { type: String, default: 'Anonyme' },
    userRole:  { type: String, default: '' },
    details:   { type: String, default: '' },      // message descriptif
    ip:        { type: String, default: '' },
}, { timestamps: true });

logSchema.index({ createdAt: -1 });               // tri rapide par date

module.exports = mongoose.model('Log', logSchema);