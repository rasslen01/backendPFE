

const Log = require('./../Model/logModel');

// ─── Helper : créer un log (utilisé dans tous les autres controllers) ──
async function createLog({ action, category = 'SYSTEM', level = 'INFO', status = 'SUCCESS',
                            userId = null, userName = 'Anonyme', userRole = '', details = '', ip = '' }) {
    try {
        await Log.create({ action, category, level, status, userId, userName, userRole, details, ip });
    } catch (e) {
        console.error('[LOG] Erreur création log:', e.message);
    }
}

module.exports.createLog = createLog;

// ─── GET /logs  — tous les logs avec filtres ──────────
module.exports.getLogs = async (req, res) => {
    try {
        const { category, level, status, search, limit = 100, page = 1 } = req.query;

        const filter = {};
        if (category && category !== 'ALL') filter.category = category;
        if (level    && level    !== 'ALL') filter.level    = level;
        if (status   && status   !== 'ALL') filter.status   = status;
        if (search) {
            filter.$or = [
                { action:   { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
                { details:  { $regex: search, $options: 'i' } },
            ];
        }

        const skip  = (Number(page) - 1) * Number(limit);
        const total = await Log.countDocuments(filter);
        const logs  = await Log.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({ logs, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── GET /logs/recent — 10 derniers pour le dashboard ─
module.exports.getRecentLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ createdAt: -1 }).limit(10);
        res.status(200).json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── DELETE /logs — vider tous les logs ───────────────
module.exports.clearLogs = async (req, res) => {
    try {
        await Log.deleteMany({});
        res.status(200).json({ message: 'Logs effacés.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── GET /logs/stats — résumé par catégorie ───────────
module.exports.getLogStats = async (req, res) => {
    try {
        const byCategory = await Log.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort:  { count: -1 } }
        ]);
        const byLevel = await Log.aggregate([
            { $group: { _id: '$level', count: { $sum: 1 } } }
        ]);
        const total = await Log.countDocuments();
        res.status(200).json({ total, byCategory, byLevel });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};