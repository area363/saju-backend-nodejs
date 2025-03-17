// server.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const moment = require("moment");
const slack = require("./app/commons/slack.js");

// ======================
// 1) CONNECT TO MONGODB
// ======================
const mongoose = require("mongoose");
const dbUrl = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/yourDBName";

mongoose
  .connect(dbUrl)
  .then(() => {
    process.env.NODE_ENV !== "test" ? console.log("MongoDB 연결 성공") : null;
  })
  .catch(async (err) => {
    console.log(err);
    if (process.env.NODE_ENV === "prod") {
      process.env.SLACK_KEY
        ? await slack.slackMessage("#ff0000", "MongoDB 연결 에러", err.message, moment().unix())
        : null;
      throw new Error("MongoDB 연결 에러!");
    } else {
      throw new Error("MongoDB 연결 에러!");
    }
  });

// ======================
// 2) EXPRESS CONFIG
// ======================
const app = express();
app.set("port", process.env.PORT || 3000);

// Logging & CORS
if (process.env.NODE_ENV === "prod") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}
app.use(cors("*"));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ======================
// 3) ROUTES
// ======================
const router = require("./app/routes/route");
const userRouter = require("./app/routes/user.route");
const memberRouter = require("./app/routes/member.route");
const groupRouter = require("./app/routes/group.route");
const manseRouter = require("./app/routes/manse.route");

app.use("/", router);
app.use("/users", userRouter);
app.use("/members", memberRouter);
app.use("/groups", groupRouter);
app.use("/manse", manseRouter);

// ======================
// 4) ERROR HANDLERS
// ======================
// 404 NotFound
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// 500 Server Error
app.use((err, req, res, next) => {
  let requestIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (process.env.NODE_ENV === "prod" && err.status !== 404) {
    const body = JSON.stringify(req.body);
    process.env.SLACK_KEY
      ? slack.slackMessage("#ff0000", "서버 에러!", `${requestIp}, ${err}:${body}`, moment().unix())
      : null;
    return res.status(500).send({
      statusCode: 500,
      message: "서버 에러!",
    });
  } else {
    return res.status(500).send({
      statusCode: 500,
      message: "서버 에러!",
      error: err,
    });
  }
});

// ======================
// 5) START SERVER
// ======================
app.listen(app.get("port"), "0.0.0.0", () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
