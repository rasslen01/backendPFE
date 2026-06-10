// Controllers/evaluationController.js

const Evaluation  = require('../Model/evaluationModel');
const Inscription = require('../Model/inscriptionModel');
const Formation   = require('../Model/formationModel');

// ── POST /evaluations  ─ Créer ou modifier son évaluation ──
exports.createOrUpdate = async (req, res) => {
    try {
        const studentId   = req.user.id;
        const { formationId, rating, comment } = req.body;

        if (!formationId || !rating) {
            return res.status(400).json({ error: 'formationId et rating sont requis' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
        }

        // Vérifier que l'étudiant est inscrit et accepté
        const inscription = await Inscription.findOne({
            studentId,
            formationId,
            status: 'accepted',
        });

        if (!inscription) {
            return res.status(403).json({
                error: 'Vous devez être inscrit et accepté pour évaluer cette formation.',
            });
        }

        // Upsert : créer ou mettre à jour l'évaluation existante
        const evaluation = await Evaluation.findOneAndUpdate(
            { formationId, studentId },
            { rating, comment: comment || '' },
            { upsert: true, new: true, runValidators: true }
        );

        // Recalculer la note moyenne de la formation
        const stats = await Evaluation.aggregate([
            { $match: { formationId: evaluation.formationId } },
            { $group: { _id: '$formationId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);

        if (stats.length > 0) {
            await Formation.findByIdAndUpdate(formationId, {
                avgRating:    Math.round(stats[0].avgRating * 10) / 10,
                ratingCount:  stats[0].count,
            });
        }

        res.status(200).json({ message: 'Évaluation enregistrée', evaluation });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Vous avez déjà évalué cette formation.' });
        }
        res.status(500).json({ error: err.message });
    }
};

// ── GET /evaluations/formation/:id  ─ Évaluations d'une formation ──
exports.getByFormation = async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ formationId: req.params.id })
            .populate('studentId', 'name user_Image')
            .sort({ createdAt: -1 });

        const total   = evaluations.length;
        const avgRating = total > 0
            ? Math.round((evaluations.reduce((s, e) => s + e.rating, 0) / total) * 10) / 10
            : 0;

        // Répartition par étoile
        const distribution = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: evaluations.filter(e => e.rating === star).length,
            pct:   total > 0 ? Math.round((evaluations.filter(e => e.rating === star).length / total) * 100) : 0,
        }));

        res.status(200).json({ evaluations, total, avgRating, distribution });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /evaluations/my/:formationId  ─ Mon évaluation pour une formation ──
exports.getMyEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findOne({
            formationId: req.params.formationId,
            studentId:   req.user.id,
        });
        res.status(200).json({ evaluation: evaluation || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── DELETE /evaluations/:id  ─ Supprimer son évaluation ──
exports.deleteEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);
        if (!evaluation) return res.status(404).json({ error: 'Évaluation introuvable' });

        // Seul l'auteur ou un admin peut supprimer
        if (evaluation.studentId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Non autorisé' });
        }

        await evaluation.deleteOne();

        // Recalculer la moyenne
        const stats = await Evaluation.aggregate([
            { $match: { formationId: evaluation.formationId } },
            { $group: { _id: '$formationId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);

        await Formation.findByIdAndUpdate(evaluation.formationId, {
            avgRating:   stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
            ratingCount: stats.length > 0 ? stats[0].count : 0,
        });

        res.status(200).json({ message: 'Évaluation supprimée' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /evaluations/admin/all  ─ Toutes les évaluations (admin) ──
exports.getAllAdmin = async (req, res) => {
    try {
        const { formationId, minRating, maxRating, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (formationId) filter.formationId = formationId;
        if (minRating || maxRating) {
            filter.rating = {};
            if (minRating) filter.rating.$gte = Number(minRating);
            if (maxRating) filter.rating.$lte = Number(maxRating);
        }

        const total       = await Evaluation.countDocuments(filter);
        const evaluations = await Evaluation.find(filter)
            .populate('studentId',   'name email')
            .populate('formationId', 'name centre domain')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json({ evaluations, total, page: Number(page) });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};