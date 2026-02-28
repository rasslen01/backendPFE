const centreModel = require('../Model/centreModel');

// GET ALL
module.exports.getAllCentres = async (req, res) => {
    try {
        const centresList = await centreModel.find();
        res.status(200).json({ centresList });
    } catch (error) {
        res.status(500).json({ error: 'Error getting centres: ' + error.message });
    }
};

// GET BY ID
module.exports.getCentre = async (req, res) => {
    try {
        const centre = await centreModel.findById(req.params.id);
        res.status(200).json({ centre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ADD
module.exports.addCentre = async (req, res) => {
    try {
        const newCentre = await centreModel.create(req.body);
        res.status(201).json({ newCentre });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// UPDATE
module.exports.updateCentre = async (req, res) => {
    try {
        const updatedCentre = await centreModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json({ updatedCentre });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE
module.exports.deleteCentre = async (req, res) => {
    try {
        await centreModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Centre deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ACCEPT
module.exports.acceptCentre = async (req, res) => {
    try {
        const centre = await centreModel.findByIdAndUpdate(
            req.params.id,
            { status: "accepted" },
            { new: true }
        );
        res.status(200).json({ centre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// REJECT
module.exports.rejectCentre = async (req, res) => {
    try {
        const centre = await centreModel.findByIdAndUpdate(
            req.params.id,
            { status: "rejected" },
            { new: true }
        );
        res.status(200).json({ centre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// SEARCH
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