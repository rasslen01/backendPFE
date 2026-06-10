// Model/evaluationModel.js

const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
    formationId: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'Formation',
        required: true,
    },
    studentId: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'User',
        required: true,
    },
    rating: {
        type:    Number,
        required: true,
        min:     1,
        max:     5,
    },
    comment: {
        type:    String,
        default: '',
        maxlength: 500,
    },
    // Empêcher les doublons : un étudiant = une évaluation par formation
}, { timestamps: true });

evaluationSchema.index({ formationId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);