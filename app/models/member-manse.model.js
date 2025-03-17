const mongoose = require("mongoose");

const MemberManseSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    bigFortuneNumber: { type: Number, required: true },
    bigFortuneStartYear: { type: Number, required: true },
    seasonStartTime: { type: String },
    heavenlyStems: {
      year: { type: String, required: true },
      month: { type: String, required: true },
      day: { type: String, required: true },
      time: { type: String },
    },
    earthlyBranches: {
      year: { type: String, required: true },
      month: { type: String, required: true },
      day: { type: String, required: true },
      time: { type: String },
    },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

module.exports = mongoose.model("MemberManse", MemberManseSchema);
