const mongoose = require('mongoose');

module.exports.connectDB = async () => {
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.url_DB).then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log("Error connecting to MongoDB: ", err);
    });
}
    
    