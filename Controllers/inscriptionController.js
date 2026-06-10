const Inscription = require("../Model/inscriptionModel");


// inscription
exports.createInscription = async (req, res) => {
  try {

    const { formationId } = req.body;
    const studentId = req.user.id;

    const existing = await Inscription.findOne({
      studentId,
      formationId
    });

    if (existing) {
      return res.status(400).json({
        message: "Déjà inscrit à cette formation"
      });
    }

    const inscription = await Inscription.create({
      studentId,
      formationId,
      status: "pending"
    });

    res.status(201).json(inscription);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// mes inscriptions
exports.getMyInscriptions = async (req, res) => {

  const studentId = req.user.id;

  const inscriptions = await Inscription.find({ studentId })
    .populate("formationId");

  res.json(inscriptions);
};



// accepter
exports.acceptInscription = async (req, res) => {

  const id = req.params.id;

  const inscription = await Inscription.findByIdAndUpdate(
    id,
    { status: "accepted" },
    { new: true }
  );

  res.json(inscription);
};



// annuler
exports.cancelInscription = async (req, res) => {

  const id = req.params.id;

  const inscription = await Inscription.findByIdAndUpdate(
    id,
    { status: "cancelled" },
    { new: true }
  );

  res.json(inscription);
};

// ── GET inscriptions des formations d'un centre ──────
exports.getInscriptionsByCentre = async (req, res) => {
  try {
    const { centreName } = req.params;

    // Trouver toutes les formations de ce centre
    const Formation = require('../Model/formationModel');
    const formations = await Formation.find({
      centre: { $regex: new RegExp('^' + centreName + '$', 'i') }
    }).select('_id name');

    if (!formations.length) {
      return res.json([]);
    }

    const formationIds = formations.map(f => f._id);

    // Trouver toutes les inscriptions pour ces formations
    const inscriptions = await Inscription.find({ formationId: { $in: formationIds } })
      .populate('studentId',   'name email')
      .populate('formationId', 'name')
      .sort({ createdAt: -1 });

    res.json(inscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT rejeter une inscription ───────────────────────
exports.rejectInscription = async (req, res) => {
  try {
    const inscription = await Inscription.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json(inscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE supprimer une inscription ─────────────────
exports.deleteInscription = async (req, res) => {
  try {
    await Inscription.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inscription supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};