// app/utils/seedManses.js
const fs = require("fs");
const path = require("path");
const Manse = require("../models/manse.model");

async function seedMansesIfEmpty() {
  try {
    const count = await Manse.countDocuments();
    if (count > 0) {
      console.log("📦 Manses collection already seeded.");
      return;
    }

    const filePath = path.join(__dirname, "../mongo/manses.json");
    const data = fs.readFileSync(filePath, "utf-8");
    const manses = JSON.parse(data);

    await Manse.insertMany(manses);
    console.log(`✅ Seeded ${manses.length} manses into MongoDB.`);
  } catch (err) {
    console.error("❌ Error seeding manses:", err.message);
  }
}

module.exports = seedMansesIfEmpty;
