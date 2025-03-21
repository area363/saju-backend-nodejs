const mongoose = require("mongoose");

const ManseSchema = new mongoose.Schema(
  {
    // Match MySQL field order & types
    solarDate: { type: Date, required: true },
    lunarDate: { type: Date, required: true },
    season: { type: String, default: null },
    seasonStartTime: { type: Date, default: null },
    leapMonth: { type: Boolean, default: null },
    yearSky: { type: String, default: null },
    yearGround: { type: String, default: null },
    monthSky: { type: String, default: null },
    monthGround: { type: String, default: null },
    daySky: { type: String, default: null },
    dayGround: { type: String, default: null }
  },
  { timestamps: true } // Adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("Manse", ManseSchema);
