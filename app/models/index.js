const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const User = require("./user.model");
const Member = require("./member.model");
const MemberManse = require("./memberManse.model");
const Manse = require("./manse.model");
const Group = require("./group.model");
const GroupMember = require("./groupMember.model");

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected...");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};

// Export database models and connection function
module.exports = {
  connectDB,
  User,
  Member,
  MemberManse,
  Manse,
  Group,
  GroupMember,
};
