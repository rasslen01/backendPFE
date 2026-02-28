const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    instructor: { type: String, required: true },
    centre: { type: String, required: true },
    location: String,
    price: { type: Number, default: 0 },
    date: Date,
    time: String,
    image: { type: String, default: "default-formation.png" },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    }
});

const Formation = mongoose.model('Formation', formationSchema);

module.exports = Formation;