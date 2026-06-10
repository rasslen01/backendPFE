// ═══════════════════════════════════════════════════════════════
// Controllers/recommendationController.js
// VERSION IA - Groq + Llama-3.3-70b (compatible Node.js < 18)
// ═══════════════════════════════════════════════════════════════

const userModel      = require('../Model/userModel');
const formationModel = require('../Model/formationModel');

// ── Fix fetch pour Node.js < 18 ──────────────────────────────
const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args));

const Groq = require('groq-sdk');

// ── Initialisation Groq avec fetch explicite ─────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  fetch,   // ← corrige "fetch is not defined"
});

// ── Cache simple (5 minutes) ──────────────────────────────────
const recommendationCache = new Map();

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 1 : Pré-filtrage léger
// ═══════════════════════════════════════════════════════════════
function preFiltrage(prefs, formations) {
  let filtered = [...formations];

  if (prefs.domaine) {
    const domLower = prefs.domaine.toLowerCase();

    const domainesProches = {
      'intelligence artificielle': ['ia', 'ai', 'machine learning', 'deep learning', 'data'],
      'développement web':         ['web', 'frontend', 'backend', 'javascript', 'react', 'node'],
      'data science':              ['data', 'big data', 'analytics', 'statistiques'],
      'cybersécurité':             ['sécurité', 'security', 'réseau', 'hacking'],
      'design ux/ui':              ['design', 'ux', 'ui', 'figma', 'graphique'],
      'cloud computing':           ['cloud', 'aws', 'azure', 'devops', 'docker'],
      'mobile development':        ['mobile', 'android', 'ios', 'flutter', 'react native'],
      'marketing digital':         ['marketing', 'seo', 'social media', 'publicité'],
    };

    const motsCles = domainesProches[domLower] || [domLower];

    const avecDomaine = filtered.filter(f => {
      if (!f.domain) return false;
      const fd = f.domain.toLowerCase();
      return fd.includes(domLower) || motsCles.some(m => fd.includes(m));
    });

    if (avecDomaine.length >= 3) filtered = avecDomaine;
  }

  // Filtre budget strict uniquement pour "Gratuit"
  if (prefs.budget === 'Gratuit') {
    const gratuit = filtered.filter(f => f.price === 0);
    if (gratuit.length >= 2) filtered = gratuit;
  }

  // Max 20 formations pour ne pas surcharger le prompt
  if (filtered.length > 20) filtered = filtered.slice(0, 20);

  console.log(`[PRÉ-FILTRE] ${filtered.length} formations envoyées à Llama`);
  return filtered;
}

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 2 : Scoring IA via Groq / Llama-3.3-70b
// ═══════════════════════════════════════════════════════════════
async function scorerAvecIA(prefs, formations) {
  const profilTexte = `
Domaine voulu: ${prefs.domaine || 'Non spécifié'}
Objectif carrière: ${prefs.objectifCarriere || 'Non spécifié'}
Niveau d'expérience: ${prefs.niveauExperience || 'Non spécifié'}
Niveau d'études: ${prefs.niveauEtude || 'Non spécifié'}
Budget: ${prefs.budget || 'Non spécifié'}
Besoins: ${(prefs.besoin || []).join(', ') || 'Non spécifié'}
Style d'apprentissage: ${(prefs.styleApprentissage || []).join(', ') || 'Non spécifié'}
Domaines d'intérêt: ${(prefs.domaineInteret || []).join(', ') || 'Non spécifié'}
Compétences à acquérir: ${(prefs.competanceInteret || []).join(', ') || 'Non spécifié'}
Statut actuel: ${prefs.etat || 'Non spécifié'}
`.trim();

  const formationsTexte = formations.map((f, i) =>
    `Formation #${i + 1}:
  - ID: ${f._id}
  - Nom: ${f.name}
  - Domaine: ${f.domain || 'Non spécifié'}
  - Niveau: ${f.level || 'Tous niveaux'}
  - Prix: ${f.price === 0 ? 'Gratuit' : f.price + ' DT'}
  - Localisation: ${f.location || 'Non spécifié'}
  - Compétences: ${(f.skills || []).join(', ') || 'Non spécifié'}
  - Description: ${(f.description || '').substring(0, 120)}`
  ).join('\n\n');

  const prompt = `Tu es un conseiller expert en orientation professionnelle et formation en Tunisie.

PROFIL DE L'ÉTUDIANT:
${profilTexte}

FORMATIONS DISPONIBLES:
${formationsTexte}

INSTRUCTIONS:
Analyse chaque formation et attribue un score de 0 à 100 selon la pertinence pour ce profil.
Critères: correspondance domaine, budget, niveau, besoins, objectif carrière.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après:
{
  "scores": [
    {
      "id": "ID_DE_LA_FORMATION",
      "score": 85,
      "raison": "Explication courte (max 15 mots)",
      "points_forts": ["point 1", "point 2"]
    }
  ]
}`;

  try {
    const completion = await groq.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      messages:        [{ role: 'user', content: prompt }],
      temperature:     0.3,
      max_tokens:      1500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { scores: [] };
    }

    return parsed.scores || [];

  } catch (error) {
    console.error('[GROQ] Erreur API:', error.message);
    // Fallback si Groq échoue
    return formations.map(f => ({
      id:           String(f._id),
      score:        60,
      raison:       'Score par défaut (IA temporairement indisponible)',
      points_forts: [f.domain || 'Formation disponible'],
    }));
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUTE PRINCIPALE : GET /recommendations
// ═══════════════════════════════════════════════════════════════
module.exports.getRecommendedFormations = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log('\n═══════════════════════════════════════════');
    console.log('[RECO-IA] 🚀 Démarrage recommandations IA');

    const userId = req.user.id;

    // Cache (5 min)
    if (recommendationCache.has(userId)) {
      const cached = recommendationCache.get(userId);
      if (Date.now() - cached.timestamp < 300_000) {
        console.log('[CACHE] ✅ Réponse depuis cache');
        return res.status(200).json(cached.data);
      }
    }

    // Charger utilisateur
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    if (!user.preferencesCompleted) {
      return res.status(400).json({
        error: 'Préférences non complétées',
        needsPreferences: true,
      });
    }

    const prefs = user.preferences._doc || user.preferences;
    console.log(`[PROFIL] Domaine: ${prefs.domaine} | Budget: ${prefs.budget} | Niveau: ${prefs.niveauExperience}`);

    // Charger formations acceptées
    const allFormations = await formationModel.find({ status: 'accepted' }).lean();
    console.log(`[DB] ${allFormations.length} formations disponibles`);

    if (allFormations.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        recommendations: [],
        message: 'Aucune formation disponible pour le moment.',
      });
    }

    // Pré-filtrage
    const formationsFiltrees = preFiltrage(prefs, allFormations);

    // Scoring IA
    console.log('[GROQ] Envoi vers Llama-3.3-70b...');
    const scoresIA = await scorerAvecIA(prefs, formationsFiltrees);
    console.log(`[GROQ] ✅ ${scoresIA.length} scores reçus`);

    // Fusionner scores + formations
    const scoresMap = new Map(scoresIA.map(s => [String(s.id), s]));

    const formationsScored = formationsFiltrees.map(f => {
      const scoreInfo = scoresMap.get(String(f._id));
      return {
        ...f,
        scoreIA:     scoreInfo?.score        ?? 50,
        raison:      scoreInfo?.raison        ?? 'Formation disponible dans votre domaine.',
        pointsForts: scoreInfo?.points_forts  ?? [],
      };
    });

    // Top 5 par score
    const top5 = formationsScored
      .sort((a, b) => b.scoreIA - a.scoreIA)
      .slice(0, 5);

    // Construire réponse finale
    const recommendations = top5.map(f => ({
      _id:         f._id,
      name:        f.name,
      domain:      f.domain,
      centre:      f.centre,
      location:    f.location,
      price:       f.price,
      image:       f.image,
      skills:      f.skills || [],
      level:       f.level,
      description: f.description,
      scoreIA:     f.scoreIA,
      explicationIA:
        f.scoreIA >= 85 ? '🎯 Excellente correspondance avec votre profil!' :
        f.scoreIA >= 70 ? '👍 Très bonne formation pour vos objectifs.' :
                          '💡 Formation intéressante à considérer.',
      raisonIA:    f.raison,
      pointsForts: [
        f.price === 0 ? '🎁 Gratuit' : `💰 ${f.price} DT`,
        f.location === 'En ligne' ? '💻 En ligne' : '📍 Présentiel',
        f.level || '📊 Tous niveaux',
        ...(f.pointsForts || []).slice(0, 1),
      ],
    }));

    console.log('\n📊 TOP 5 RECOMMANDATIONS IA:');
    recommendations.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.scoreIA}/100] ${r.name}`);
      console.log(`     → ${r.raisonIA}`);
    });
    console.log(`⏱️  Temps total: ${Date.now() - startTime}ms`);
    console.log('═══════════════════════════════════════════\n');

    const responseData = {
      success:        true,
      count:          recommendations.length,
      recommendations,
      methode:        'IA - Groq Llama-3.3-70b',
      tempsExecution: `${Date.now() - startTime}ms`,
      profil: {
        domaine: prefs.domaine,
        budget:  prefs.budget,
        niveau:  prefs.niveauExperience,
      },
    };

    recommendationCache.set(userId, { data: responseData, timestamp: Date.now() });
    res.status(200).json(responseData);

  } catch (error) {
    console.error('[RECO-IA] ❌ Erreur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// ROUTE : Invalider le cache
// ═══════════════════════════════════════════════════════════════
module.exports.invalidateCache = async (req, res) => {
  const userId = req.user.id;
  recommendationCache.delete(userId);
  console.log(`[CACHE] Cache invalidé pour user ${userId}`);
  res.status(200).json({ message: 'Cache invalidé avec succès' });
};