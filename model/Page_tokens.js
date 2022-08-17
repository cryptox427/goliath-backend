const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PagetokenSchema = new Schema({
  id: {
    type: Schema.Types.ObjectId,
  },
  page_index: {
    type: Number,
  },
  page_token: {
    type: String,
  },
});

module.exports = mongoose.model("page_tokens", PagetokenSchema);
