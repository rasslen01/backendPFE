const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    color: { type: String, default: '#3498db' }
});

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;