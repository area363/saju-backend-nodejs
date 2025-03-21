const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const moment = require("moment");
const slack = require("./app/commons/slack.js");
const router = require("./app/routes/route");
const userRouter = require("./app/routes/user.route");
const memberRouter = require("./app/routes/member.route");
const groupRouter = require("./app/routes/group.route");
const manseRouter = require("./app/routes/manse.route");

// ✅ Swagger
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./openapi.yaml");
const { connectDB } = require("./app/models");
const seedMansesIfEmpty = require("./app/utils/seedManses"); // ✅ Add this line

const app = express();
app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS & Logging
if (process.env.NODE_ENV === "prod") {
  app.use(morgan("combined"));
  app.use(cors("*"));
} else {
  app.use(morgan("dev"));
  app.use(cors("*"));
}

// ✅ Routes
app.use("/", router);
app.use("/users", userRouter);
app.use("/members", memberRouter);
app.use("/groups", groupRouter);
app.use("/manse", manseRouter);

// ✅ Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 & 500 error handling (as-is from your setup)
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  let requestIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  if (process.env.NODE_ENV === "prod" && err.status !== 404) {
    const body = JSON.stringify(req.body);
    process.env.SLACK_KEY &&
      slack.slackMessage("#ff0000", "서버 에러!", `${requestIp}, ${err}:${body}`, moment().unix());
    return res.status(500).send({ statusCode: 500, message: "서버 에러!" });
  } else {
    return res.status(err.status || 500).send({
      statusCode: err.status || 500,
      message: err.message || "서버 에러!",
      error: {
        message: err.message,
        stack: process.env.NODE_ENV !== "prod" ? err.stack : undefined
      }
    });
    
  }
});

// MongoDB 연결
connectDB()
  .then(async () => {
    console.log("✅ MongoDB Connected.");
    await seedMansesIfEmpty(); // ✅ Seed if empty
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

app.listen(app.get("port"), "0.0.0.0", () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
