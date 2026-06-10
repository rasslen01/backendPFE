const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name:        { type: String, required: true, unique: true },
    icon:        { type: String, default: '🏅' },
    color:       { type: String, default: '#3498db' },
    description: { type: String, default: '' },
    condition: {
        type: String,
        enum: [
            'signup', 'inscription', 'review',
            'level_2', 'level_5', 'level_10',
            // ✅ NOUVEAU : badges liés au nombre d'avis/inscriptions
            'review_3', 'review_10', 'inscription_3', 'inscription_5',
            null
        ],
        default: null
    },
    xpRequired:   { type: Number, default: 0 },   // badge débloqué si xp >= xpRequired
    xpThreshold:  { type: Boolean, default: false }, // ✅ NOUVEAU : true = badge XP automatique
    isAuto:       { type: Boolean, default: false },
}, { timestamps: true });

const Badge = mongoose.model('Badge', badgeSchema);
module.exports = Badge;