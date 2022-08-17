const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Price_VolumeSchema = new Schema({
  id: {
    type: Schema.Types.ObjectId,
  },

  date: {
    type: Date,
    default: Date.now,
  },

  collectionName: {
    type: String,
  },

  floor_price: {
    type: Number,
  },

  average_price: {
    type: Number,
  },
  one_day_sales: {
    type: Number,
  },
  one_day_average_price: {
    type: Number,
  },
  one_day_volume: {
    type: Number,
  },

  total_volume: {
    type: Number,
  },
});

module.exports = mongoose.model("price_volume", Price_VolumeSchema);
