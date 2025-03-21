// app/models/memberManse.model.js
const mongoose = require("mongoose");

const MemberManseSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
    unique: true
  },
  bigFortuneNumber: {
    type: Number,
    required: true
  },
  bigFortuneStartYear: {
    type: Number,
    required: true
  },
  seasonStartTime: {
    type: String  // Or `Date` if you're parsing timestamps
  },
  yearSky: {
    type: String,
    required: true
  },
  yearGround: {
    type: String,
    required: true
  },
  monthSky: {
    type: String,
    required: true
  },
  monthGround: {
    type: String,
    required: true
  },
  daySky: {
    type: String,
    required: true
  },
  dayGround: {
    type: String,
    required: true
  },
  timeSky: String,
  timeGround: String
}, {
  timestamps: true
});

module.exports = mongoose.model("MemberManse", MemberManseSchema);
