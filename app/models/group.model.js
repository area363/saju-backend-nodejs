const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, maxlength: 30 },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

// Define virtual relationships
GroupSchema.virtual("members", {
  ref: "GroupMember",
  localField: "_id",
  foreignField: "groupId",
});

module.exports = mongoose.model("Group", GroupSchema);
