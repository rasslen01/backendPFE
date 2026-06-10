const mongoose = require('mongoose');

const preferencesSchema = new mongoose.Schema({
  domaine: { type: String, default: "" },
  objectifCarriere: { type: String, default: "" },
  domaineInteret: { type: [String], default: [] },
  competanceParDomaine: { type: [String], default: [] },
  competanceInteret: { type: [String], default: [] },
  niveauExperience: { type: String, default: "" },
  dateNaissance: { type: String, default: "" },
  niveauEtude: { type: String, default: "" },
  niveauEngagement: { type: String, default: "" },
  besoin: { type: [String], default: [] },
  niveauDifficulte: { type: String, default: "" },
  styleApprentissage: { type: [String], default: [] },
  budget: { type: String, default: "" },
  etat: { type: String, default: "" },
  disponibilite: { type: [String], default: [] },
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true, match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['ADMIN', 'STUDENT', 'CENTRE'], default: 'STUDENT' },
    age: Number,
    city: String,
    user_Image: { type: String, required: false, default: 'client.jpg' },
    isActive: Boolean,
    // ── Gamification ──────────────────────────────
    xp:    { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    reviewCount:      { type: Number, default: 0 },  // ✅ AJOUTER
inscriptionCount: { type: Number, default: 0 },  // ✅ AJOUTER
    // ── Email verification ─────────────────────────
    isEmailVerified:      { type: Boolean, default: false },
    emailVerifyToken:     { type: String,  default: null  },
    // ── Reset password ──────────────────────────────
    resetPasswordToken:   { type: String, default: null },
    resetPasswordExpires: { type: Date,   default: null },
    // ─────────────────────────────────────────────
    preferences: { type: preferencesSchema, default: () => ({}) },
    preferencesCompleted: { type: Boolean, default: false },
});

const User = mongoose.model('User', userSchema);
module.exports = User;