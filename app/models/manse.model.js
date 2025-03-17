const mongoose = require("mongoose");

const ManseSchema = new mongoose.Schema(
  {
    solarDate: { type: Date, required: true },
    lunarDate: { type: Date, required: true },
    season: { type: String },
    seasonStartTime: { type: Date },
    leapMonth: { type: Boolean },
    heavenlyStems: {
      year: { type: String },
      month: { type: String },
      day: { type: String },
      time: { type: String },
    },
    earthlyBranches: {
      year: { type: String },
      month: { type: String },
      day: { type: String },
      time: { type: String },
    },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

module.exports = mongoose.model("Manse", ManseSchema);
