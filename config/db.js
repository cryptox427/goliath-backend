const mongoose = require("mongoose");

const db =
  "mongodb+srv://isempty:Rh1mnPPaOJQnxsMn@cluster0.kr7trnx.mongodb.net/?retryWrites=true&w=majority";

const connectDB = async () => {
  const option = {
    sockettimeoutMS: 360000,
    connectTimeoutMS: 360000,
    // autoReconnect: true,
    keepAlive: true,
    useNewUrlParser: true,
  };
  try {
    await mongoose.connect(db, option);

    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
