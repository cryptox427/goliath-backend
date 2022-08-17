const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Collectionslugs = new Schema({
  id: {
    type: Schema.Types.ObjectId,
  },
  collectionSlug: {
    type: String,
  },
  collectionAddress: {
    type: String,
  },
  total_supply: {
    type: Number,
  },
});

module.exports = mongoose.model("collectionslugs", Collectionslugs);
