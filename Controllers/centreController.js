const centreModel = require('../Model/centreModel');
const userModel = require('../Model/userModel');
const formationModel = require('../Model/formationModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ========================================
// MULTER CONFIG
// ========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/centres/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase())
               && allowed.test(file.mimetype);
    valid ? cb(null, true) : cb(new Error('Images uniquement (jpeg, jpg, png, webp)'));
};

module.exports.upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
});

// ========================================
// GET ALL
// ========================================
module.exports.getAllCentres = async (req, res) => {
    try {
        const centresList = await centreModel.find();
        res.status(200).json({ centresList });
    } catch (error) {
        res.status(500).json({ error: 'Error getting centres: ' + error.message });
    }
};

// ========================================
// GET BY ID
// ========================================
module.exports.getCentre = async (req, res) => {
    try {
        const centre = await centreModel.findById(req.params.id);
        if (!centre) return res.status(404).json({ error: "Centre non trouvé" });
        res.status(200).json({ centre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// GET MY CENTRE PROFILE (centre connecté)
// ========================================
module.exports.getMyCentreProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ error: "ID utilisateur manquant" });
        }

        const user = await userModel.findById(userId);
        if (!user || user.role !== 'CENTRE') {
            return res.status(403).json({ error: "Accès non autorisé - Compte non centre" });
        }

        let centre = await centreModel.findOne({ userId });

        if (!centre) {
            const existingCentre = await centreModel.findOne({ email: user.email });

            if (existingCentre) {
                existingCentre.userId = userId;
                await existingCentre.save();
                centre = existingCentre;
                console.log(`Centre existant lié à l'utilisateur: ${user.email}`);
            } else {
                centre = new centreModel({
                    userId,
                    name: user.name,
                    email: user.email,
                    phone: "",
                    address: "",
                    website: "",
                    description: "",
                    foundedYear: "",
                    logo: "default-centre.png",
                    coverImage: "",
                    status: "accepted"
                });
                await centre.save();
                console.log(`Nouveau centre créé: ${user.email}`);
            }
        }

        res.status(200).json({
            success: true,
            centre,
            user: { name: user.name, email: user.email }
        });

    } catch (error) {
        console.error('Erreur getMyCentreProfile:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// UPDATE MY CENTRE PROFILE
// ========================================
module.exports.updateMyCentreProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = { ...req.body };

        // Champs protégés
        delete updates.userId;
        delete updates.email;
        delete updates.status;

        const centre = await centreModel.findOneAndUpdate(
            { userId },
            updates,
            { new: true, upsert: true }
        );

        if (updates.name) {
            await userModel.findByIdAndUpdate(userId, { name: updates.name });
        }

        res.status(200).json({
            success: true,
            centre,
            message: "Profil mis à jour avec succès"
        });

    } catch (error) {
        console.error('Erreur updateMyCentreProfile:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// UPLOAD LOGO OU COVER IMAGE
// ========================================
module.exports.uploadCentreImage = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier reçu" });
        }

        const imageType = req.body.type; // 'logo' ou 'coverImage'
        if (!['logo', 'coverImage'].includes(imageType)) {
            return res.status(400).json({ error: "Type invalide — utiliser 'logo' ou 'coverImage'" });
        }

        // Supprimer l'ancien fichier si ce n'est pas le logo par défaut
        const existing = await centreModel.findOne({ userId });
        if (existing) {
            const oldFile = existing[imageType];
            if (oldFile && oldFile !== 'default-centre.png' && oldFile !== '') {
                const oldPath = path.join('uploads/centres/', oldFile);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
        }

        const centre = await centreModel.findOneAndUpdate(
            { userId },
            { [imageType]: req.file.filename },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            filename: req.file.filename,
            url: `/uploads/centres/${req.file.filename}`,
            centre,
            message: "Image uploadée avec succès"
        });

    } catch (error) {
        console.error('Erreur uploadCentreImage:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// GET MY CENTRE FORMATIONS
// ========================================
module.exports.getMyCentreFormations = async (req, res) => {
    try {
        const userId = req.user.id;

        const centre = await centreModel.findOne({ userId });
        if (!centre) {
            return res.status(404).json({ error: "Centre non trouvé" });
        }

        const formations = await formationModel.find({
            centre: centre.name,
            status: "accepted"
        }).sort({ createdAt: -1 });

        const totalStudents = formations.reduce((sum, f) => sum + (f.studentsCount || 0), 0);

        res.status(200).json({
            success: true,
            count: formations.length,
            formations,
            totalStudents
        });

    } catch (error) {
        console.error('Erreur getMyCentreFormations:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// ADD (admin)
// ========================================
module.exports.addCentre = async (req, res) => {
    try {
        const newCentre = await centreModel.create(req.body);
        res.status(201).json({ newCentre });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ========================================
// UPDATE (admin)
// ========================================
module.exports.updateCentre = async (req, res) => {
    try {
        const updatedCentre = await centreModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedCentre) return res.status(404).json({ error: "Centre non trouvé" });
        res.status(200).json({ updatedCentre });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ========================================
// DELETE (admin)
// ========================================
module.exports.deleteCentre = async (req, res) => {
    try {
        await centreModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Centre supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// ACCEPT (admin)
// ========================================
module.exports.acceptCentre = async (req, res) => {
    try {
        const centre = await centreModel.findByIdAndUpdate(
            req.params.id,
            { status: "accepted" },
            { new: true }
        );
        if (!centre) return res.status(404).json({ error: "Centre non trouvé" });
        res.status(200).json({ centre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// REJECT (admin)
// ========================================
module.exports.rejectCentre = async (req, res) => {
    try {
        const centre = await centreModel.findByIdAndUpdate(
            req.params.id,
            { status: "rejected" },
            { new: true }
        );
        if (!centre) return res.status(404).json({ error: "Centre non trouvé" });
        res.status(200).json({ centre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// SEARCH
// ========================================
module.exports.searchCentres = async (req, res) => {
    try {
        const centres = await centreModel.find({
            name: { $regex: req.query.name, $options: "i" }
        });
        res.status(200).json({ centres });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// GET ACCEPTED CENTRES
// ========================================
module.exports.getAcceptedCentres = async (req, res) => {
    try {
        const centres = await centreModel.find({ status: "accepted" }).select("name email status logo");
        res.status(200).json({ centres });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};