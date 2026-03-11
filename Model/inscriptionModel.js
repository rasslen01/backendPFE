const mongoose = require("mongoose");

const inscriptionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    formationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Formation",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inscription", inscriptionSchema);