const formationModel = require('../Model/formationModel');

// GET ALL
module.exports.getAllFormations = async (req, res) => {
    try {
        const formationsList = await formationModel.find();
        res.status(200).json({ formationsList });
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

// ADD
module.exports.addFormation = async (req, res) => {
    try {
        const newFormation = await formationModel.create(req.body);
        res.status(201).json({ newFormation });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// UPDATE
module.exports.updateFormation = async (req, res) => {
    try {
        const updatedFormation = await formationModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json({ updatedFormation });
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