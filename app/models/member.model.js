const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    nickname: { type: String, required: true },
    gender: { type: String, required: true },
    birthdayType: { type: String, required: true },
    birthday: { type: Date, required: true },
    time: { type: String },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

// Define virtual relationships
MemberSchema.virtual("groupMembers", {
  ref: "GroupMember",
  localField: "_id",
  foreignField: "memberId",
});

MemberSchema.virtual("manse", {
  ref: "MemberManse",
  localField: "_id",
  foreignField: "memberId",
});

module.exports = mongoose.model("Member", MemberSchema);
