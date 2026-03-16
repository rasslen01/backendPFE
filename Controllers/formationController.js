const formationModel = require('../Model/formationModel');
const centreModel = require('../Model/centreModel');

// GET ALL
module.exports.getAllFormations = async (req, res) => {
    try {
        const formationsList = await formationModel.find();

        const formationsWithLogo = await Promise.all(
            formationsList.map(async (f) => {
                const obj = f.toObject();
                // Chercher le centre par nom et récupérer son logo Base64
                if (!obj.centreLogo && obj.centre) {
                    const centre = await centreModel.findOne({ name: obj.centre });
                    if (centre && centre.logo) {
                        obj.centreLogo = centre.logo; // déjà en Base64, utilisable directement
                    }
                }
                return obj;
            })
        );
        res.status(200).json({ formationsList: formationsWithLogo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET BY ID
module.exports.getFormation = async (req, res) => {
    try {
        const formation = await formationModel.findById(req.params.id);
        res.status(200).json({ formation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE
module.exports.updateFormation = async (req, res) => {
    try {
        const body = { ...req.body };
        if (typeof body.centreLogo !== 'string') body.centreLogo = '';
        
        console.log("📦 Body reçu update:", body);

        const updatedFormation = await formationModel.findByIdAndUpdate(
            req.params.id,
            { $set: body },   // ← changez body par { $set: body }
            { new: true }
        );

        console.log("✅ Formation après update:", updatedFormation?.image);
        res.status(200).json({ updatedFormation });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ADD — même protection
module.exports.addFormation = async (req, res) => {
    try {
        const body = { ...req.body };

        if (typeof body.centreLogo !== 'string') {
            body.centreLogo = '';
        }

        const newFormation = await formationModel.create(body);
        res.status(201).json({ newFormation });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE
module.exports.deleteFormation = async (req, res) => {
    try {
        await formationModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Formation deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ACCEPT
module.exports.acceptFormation = async (req, res) => {
    try {
        const formation = await formationModel.findByIdAndUpdate(
            req.params.id,
            { status: "accepted" },
            { new: true }
        );
        res.status(200).json({ formation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// REJECT
module.exports.rejectFormation = async (req, res) => {
    try {
        const formation = await formationModel.findByIdAndUpdate(
            req.params.id,
            { status: "rejected" },
            { new: true }
        );
        res.status(200).json({ formation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
module.exports.getFormationsByCentre = async (req, res) => {
  try {
    const centre = req.params.centre;

    const formations = await formationModel.find({
      centre: centre
    });

    res.status(200).json({ formationsList: formations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const multer = require('multer');
const path = require('path');

// Config multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'formation-' + unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ok = allowed.test(path.extname(file.originalname).toLowerCase());
        ok ? cb(null, true) : cb(new Error('Image uniquement (jpg, png, webp, gif)'));
    }
});

module.exports.uploadFormationImage = [
    upload.single('image'),
    (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
        res.status(200).json({ imageUrl: `/uploads/${req.file.filename}` });
    }
];