const mongoose = require("mongoose");

const GroupMemberSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

module.exports = mongoose.model("GroupMember", GroupMemberSchema);
