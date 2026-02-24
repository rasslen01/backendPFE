const mongoose = require('mongoose');

module.exports.connectDB = async () => {
    mongoose.set('strictQuery', false);
    mongoose.connect("mongodb+srv://BackendPFEdb:QXaEqr7E8TFyMefg@cluster0.g8k6mmk.mongodb.net/").then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log("Error connecting to MongoDB: ", err);
    });
}
    
    