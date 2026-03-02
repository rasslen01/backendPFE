const userModel = require('../Model/userModel');
const formationModel = require('../Model/formationModel');

const DAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

const norm = (s) => (s || "").toString().trim().toLowerCase();

function budgetToRange(budget) {
  switch (budget) {
    case "Gratuit": return { freeOnly: true };
    case "Moins de 50€": return { min: 0, max: 50 };
    case "50-100€": return { min: 50, max: 100 };
    case "100-300€": return { min: 100, max: 300 };
    case "300€+": return { min: 300, max: Infinity };
    case "Illimité": return null;
    default: return null;
  }
}

function computeScore(f, p) {
  let score = 0;

  // 1) Domaine principal
  if (p.domaine && f.domain && norm(p.domaine) === norm(f.domain)) score += 8;

  // 2) Domaines d’intérêt
  if (Array.isArray(p.domaineInteret) && p.domaineInteret.some(d => norm(d) === norm(f.domain))) {
    score += 4;
  }

  // 3) Skills match
  const userSkills = [
    ...(p.competanceInteret || []),
    ...(p.competanceParDomaine || [])
  ].map(norm);

  const formationSkills = (f.skills || []).map(norm);
  const matches = formationSkills.filter(s => userSkills.includes(s));
  score += matches.length * 2;

  // 4) Niveau / difficulté
  if (p.niveauExperience && f.level && norm(p.niveauExperience) === norm(f.level)) score += 2;
  if (p.niveauDifficulte && f.difficulty && norm(p.niveauDifficulte) === norm(f.difficulty)) score += 2;

  // 5) Budget
  const range = budgetToRange(p.budget);
  if (range) {
    if (range.freeOnly) {
      if ((f.price || 0) > 0) return -Infinity; // filter
      score += 2;
    } else {
      const price = f.price || 0;
      if (price >= range.min && price <= range.max) score += 2;
      else score -= 2;
    }
  }

  // 6) Disponibilité (jours)
  if (Array.isArray(p.disponibilite) && p.disponibilite.length && f.date) {
    const dayName = DAYS[new Date(f.date).getDay()];
    if (p.disponibilite.includes(dayName)) score += 1;
  }

  // bonus: gratuit
  if ((f.price || 0) === 0) score += 1;

  return score;
}

module.exports.getRecommendedFormations = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.preferencesCompleted) {
      return res.status(400).json({ error: "Preferences not completed" });
    }

    const prefs = user.preferences || {};

    // On recommande seulement les formations acceptées et à venir
    const today = new Date();
    const formations = await formationModel.find({
      status: "accepted",
      date: { $gte: today }
    });

    const scored = formations
      .map(f => {
        const score = computeScore(f, prefs);
        return { ...f.toObject(), score };
      })
      .filter(x => x.score !== -Infinity)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.status(200).json({
      count: scored.length,
      recommendations: scored
    });

  } catch (error) {
    res.status(500).json({ error: "Error recommending formations: " + error.message });
  }
};