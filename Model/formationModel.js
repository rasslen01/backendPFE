const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    instructor: { type: String, required: true },
    centre: { type: String, required: true },
    location: String,
    price: { type: Number, default: 0 },
    date: Date,
    time: String,
    image: { type: String, default: "" },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    },
    centreLogo: { type: String, default: "" },
     // ✅ Champs utiles pour recommandations
  domain: { type: String, default: "" },                 // ex: "Développement Web"
  skills: { type: [String], default: [] },               // ex: ["React","Node.js"]
  level: { type: String, default: "" },                  // ex: "Débutant" / "Intermédiaire" / "Avancé" / "Expert"
  difficulty: { type: String, default: "" },             // ex: "Facile" / "Moyen" / "Difficile" / "Expert"
  learningStyle: { type: [String], default: [] },      // ex: ["Visuel","Auditif"]

});

const Formation = mongoose.model('Formation', formationSchema);

module.exports = Formation;