const req = require('express/lib/request');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: {type: String, unique: true , required: true , match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"] , lowercase: true},
    password:{ type: String, required: true, minlength: 6 , },
    role: {
        type: String,
        enum: ['ADMIN', 'STUDENT', 'CENTRE'],
        default: 'STUDENT'
    },
    age: Number,
    city: String,
    user_Image :{ type: String , required: false, default:'client.png' },
    isActive: Boolean,
    xp: { type: Number, default: 0 },
     badges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge'
    }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;