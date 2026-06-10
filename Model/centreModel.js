const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema({
    // Liaison avec l'utilisateur
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    // Informations du centre
    name: { type: String, required: true },
    email: { 
        type: String, 
        unique: true, 
        required: true, 
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], 
        lowercase: true
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    website: { type: String, default: "" },
    description: { type: String, default: "" },
    foundedYear: { type: String, default: "" },
    logo: { type: String, default: "default-centre.png" },
    coverImage: { type: String, default: "" },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    },
    // Statistiques
    formationsCount: { type: Number, default: 0 },
    studentsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
}, { timestamps: true });

const Centre = mongoose.model('Centre', centreSchema);

module.exports = Centre;