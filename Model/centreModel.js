const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { 
        type: String, 
        unique: true, 
        required: true, 
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], 
        lowercase: true
    },
    logo: { type: String, default: "default-centre.png" },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    }
});

const Centre = mongoose.model('Centre', centreSchema);

module.exports = Centre;