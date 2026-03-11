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