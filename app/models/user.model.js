const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

// Define relationships with `Member` and `Group`
UserSchema.virtual("members", {
  ref: "Member",
  localField: "_id",
  foreignField: "userId",
});

UserSchema.virtual("groups", {
  ref: "Group",
  localField: "_id",
  foreignField: "userId",
});

module.exports = mongoose.model("User", UserSchema);
