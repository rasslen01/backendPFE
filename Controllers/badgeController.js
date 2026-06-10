// ═══════════════════════════════════════════════════════
// Controllers/badgeController.js
// ═══════════════════════════════════════════════════════

const userModel  = require('../Model/userModel');
const badgeModel = require('../Model/badgeModel');

// ─── Constantes XP ────────────────────────────────────
const XP_LEVELS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

const XP_REWARDS = {
    signup:      50,
    inscription: 100,   // XP gagné à chaque inscription à une formation
    review:      75,    // XP gagné à chaque avis posté
};

const LEVEL_NAMES = [
    '', 'Debutant', 'Apprenti', 'Explorateur', 'Confirme',
    'Expert', 'Maitre', 'Champion', 'Legende', 'Elite', 'Formini Pro'
];

// ─── Helpers ──────────────────────────────────────────
function _calculateLevel(xp) {
    let level = 1;
    for (let i = 1; i < XP_LEVELS.length; i++) {
        if (xp >= XP_LEVELS[i]) level = i + 1;
        else break;
    }
    return level;
}

function _getLevelProgress(xp) {
    const level    = _calculateLevel(xp);
    const current  = XP_LEVELS[level - 1] || 0;
    const next     = XP_LEVELS[level]     || XP_LEVELS[XP_LEVELS.length - 1];
    return Math.min(Math.max(Math.round(((xp - current) / (next - current)) * 100), 0), 100);
}

async function _addXP(userId, action) {
    const amount = XP_REWARDS[action] || 0;
    if (!amount) return null;
    const user = await userModel.findById(userId);
    if (!user) return null;
    const oldLevel = user.level || 1;
    user.xp    = (user.xp || 0) + amount;
    user.level = _calculateLevel(user.xp);
    await user.save();
    return {
        xpGained: amount,
        totalXP:  user.xp,
        level:    user.level,
        leveledUp: user.level > oldLevel,
        progress: _getLevelProgress(user.xp),
    };
}

// ✅ Badge par condition simple (signup, inscription, review)
async function _awardBadgeByCondition(userId, condition) {
    const badge = await badgeModel.findOne({ condition });
    if (!badge) return null;
    const user = await userModel.findById(userId);
    if (!user) return null;
    if (user.badges.some(b => b.toString() === badge._id.toString())) return null;
    user.badges.push(badge._id);
    await user.save();
    return badge;
}

// ✅ Badges de niveau (level_2, level_5, level_10)
async function _checkLevelBadges(userId) {
    const user = await userModel.findById(userId).populate('badges');
    if (!user) return [];
    const levelBadges  = await badgeModel.find({ condition: { $in: ['level_2', 'level_5', 'level_10'] } });
    const userBadgeIds = user.badges.map(b => b._id.toString());
    const newBadges    = [];
    for (const badge of levelBadges) {
        if (userBadgeIds.includes(badge._id.toString())) continue;
        const conditionMet =
            (badge.condition === 'level_2'  && user.level >= 2)  ||
            (badge.condition === 'level_5'  && user.level >= 5)  ||
            (badge.condition === 'level_10' && user.level >= 10);
        if (conditionMet) { user.badges.push(badge._id); newBadges.push(badge); }
    }
    if (newBadges.length > 0) await user.save();
    return newBadges;
}

// ✅ NOUVEAU : Badges débloqués par seuil XP (xpThreshold: true)
async function _checkXPThresholdBadges(userId) {
    const user = await userModel.findById(userId);
    if (!user) return [];
    // On récupère tous les badges XP que l'utilisateur n'a pas encore
    const xpBadges = await badgeModel.find({
        xpThreshold: true,
        xpRequired:  { $lte: user.xp },
        _id:         { $nin: user.badges }
    });
    if (xpBadges.length === 0) return [];
    user.badges.push(...xpBadges.map(b => b._id));
    await user.save();
    return xpBadges;
}

// ✅ NOUVEAU : Badges liés au comptage (nb d'avis, nb d'inscriptions)
// userModel doit avoir reviewCount et inscriptionCount (incrémentés ailleurs)
async function _checkCountBadges(userId) {
    const user = await userModel.findById(userId);
    if (!user) return [];

    // Conditions de comptage disponibles → seuil
    const countConditions = {
        review_3:       { field: 'reviewCount',      min: 3  },
        review_10:      { field: 'reviewCount',      min: 10 },
        inscription_3:  { field: 'inscriptionCount', min: 3  },
        inscription_5:  { field: 'inscriptionCount', min: 5  },
    };

    const eligibleConditions = Object.entries(countConditions)
        .filter(([, { field, min }]) => (user[field] || 0) >= min)
        .map(([condition]) => condition);

    if (eligibleConditions.length === 0) return [];

    const badges = await badgeModel.find({
        condition: { $in: eligibleConditions },
        _id:       { $nin: user.badges }
    });

    if (badges.length === 0) return [];
    user.badges.push(...badges.map(b => b._id));
    await user.save();
    return badges;
}

// ─── processAction : point d'entrée principal ─────────
// Appelé par authController (signup), inscriptionController, reviewController
module.exports.processAction = async function (userId, action) {
    // 1. Ajouter XP
    const xpResult = await _addXP(userId, action);
    if (!xpResult) return null;

    // 2. Badge lié à l'action directe (ex: premier review, première inscription)
    const actionBadge = await _awardBadgeByCondition(userId, action);

    // 3. Badges de niveau
    const levelBadges = await _checkLevelBadges(userId);

    // 4. ✅ NOUVEAU : Badges par seuil XP
    const xpBadges = await _checkXPThresholdBadges(userId);

    // 5. ✅ NOUVEAU : Badges par comptage (review_3, inscription_5, etc.)
    const countBadges = await _checkCountBadges(userId);

    return {
        ...xpResult,
        earnedBadges: [
            ...levelBadges,
            ...(actionBadge ? [actionBadge] : []),
            ...xpBadges,
            ...countBadges,
        ],
    };
};

// ─── Routes ───────────────────────────────────────────

module.exports.getMyXP = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id)
            .select('xp level badges name')
            .populate('badges');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({
            xp:          user.xp || 0,
            level:       user.level || 1,
            levelName:   LEVEL_NAMES[user.level] || `Niveau ${user.level}`,
            progress:    _getLevelProgress(user.xp || 0),
            nextLevelXP: XP_LEVELS[user.level] || null,
            badges:      user.badges,
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.addReviewXP = async (req, res) => {
    try {
        // ✅ NOUVEAU : incrémenter reviewCount avant processAction
        await userModel.findByIdAndUpdate(req.user.id, { $inc: { reviewCount: 1 } });
        const result = await module.exports.processAction(req.user.id, 'review');
        if (!result) return res.status(400).json({ error: 'Action invalide' });
        res.status(200).json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ✅ NOUVEAU : endpoint appelé par inscriptionController
module.exports.addInscriptionXP = async (req, res) => {
    try {
        await userModel.findByIdAndUpdate(req.user.id, { $inc: { inscriptionCount: 1 } });
        const result = await module.exports.processAction(req.user.id, 'inscription');
        if (!result) return res.status(400).json({ error: 'Action invalide' });
        res.status(200).json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.getLeaderboard = async (req, res) => {
    try {
        const users = await userModel
            .find({ role: 'STUDENT' }, 'name xp level badges user_Image')
            .populate('badges').sort({ xp: -1 }).limit(20);
        res.status(200).json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.getAllUsersWithBadges = async (req, res) => {
    try {
        const users = await userModel.find().select('-password').populate('badges');
        res.status(200).json({ users });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.getUserBadges = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.userId).populate('badges');
        res.status(200).json({ badges: user.badges, xp: user.xp, level: user.level });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.addBadgeToUser = async (req, res) => {
    try {
        const badge = await badgeModel.findOne({ name: req.body.badge });
        const user  = await userModel.findById(req.params.userId);
        if (!badge) return res.status(404).json({ message: 'Badge not found' });
        if (!user)  return res.status(404).json({ message: 'User not found' });
        if (user.badges.some(b => b.toString() === badge._id.toString()))
            return res.status(400).json({ message: 'Badge deja attribue' });
        user.badges.push(badge._id);
        await user.save();
        const updated = await userModel.findById(user._id).populate('badges');
        res.status(200).json({ message: 'Badge ajoute', user: updated });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.removeBadgeFromUser = async (req, res) => {
    try {
        const badge = await badgeModel.findOne({ name: req.body.badge });
        const user  = await userModel.findById(req.params.userId);
        if (!badge || !user) return res.status(404).json({ message: 'Introuvable' });
        user.badges = user.badges.filter(b => b.toString() !== badge._id.toString());
        await user.save();
        const updated = await userModel.findById(user._id).populate('badges');
        res.status(200).json({ message: 'Badge retire', user: updated });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.getAvailableBadges = async (req, res) => {
    try {
        const badges = await badgeModel.find();
        res.status(200).json({ badges });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.addBadgeType = async (req, res) => {
    try {
        const newBadge = await badgeModel.create(req.body);
        res.status(201).json({ newBadge });
    } catch (err) { res.status(400).json({ error: err.message }); }
};

module.exports.updateBadgeType = async (req, res) => {
    try {
        const updated = await badgeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ badge: updated });
    } catch (err) { res.status(400).json({ error: err.message }); }
};

module.exports.deleteBadgeType = async (req, res) => {
    try {
        await badgeModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Badge supprime' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.getBadgeStats = async (req, res) => {
    try {
        const stats = await userModel.aggregate([
            { $unwind: '$badges' },
            { $group: { _id: '$badges', count: { $sum: 1 } } },
            { $lookup: { from: 'badges', localField: '_id', foreignField: '_id', as: 'badge' } },
            { $unwind: '$badge' },
            { $project: { _id: 0, name: '$badge.name', icon: '$badge.icon', count: 1 } },
            { $sort: { count: -1 } }
        ]);
        res.status(200).json({ stats });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports.searchUsersByBadges = async (req, res) => {
    try {
        const badge = await badgeModel.findOne({ name: { $regex: req.query.name, $options: 'i' } });
        if (!badge) return res.status(404).json({ message: 'Badge introuvable' });
        const users = await userModel.find({ badges: badge._id }).populate('badges');
        res.status(200).json({ users });
    } catch (err) { res.status(500).json({ error: err.message }); }
};