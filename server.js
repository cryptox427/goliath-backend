const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const connectDB = require("./config/db");
const { router, dailyUpdate } = require("./router/collection");
connectDB();
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", router);

setInterval(dailyUpdate, 24 * 3600 * 1000);

app.listen(process.env.PORT || 5000, () =>
  console.log("Example app is listening on port 5000.")
);
