const authJwt = require("./verify-jwt-token");
const apiLimiter = process.env.NODE_ENV === "prod" ? require("./api-limit").limit : [];
const JWT_SECRET = process.env.JWT_SECRET;
const express = require("express");
const router = express.Router();
const manseController = require("../controllers/manse.controller.js");
const { param } = require("express-validator");

//만세력 계산
router.get(
  "/members/:memberId/fortune/:bigNum?/:smallNum?",
  [
    apiLimiter,
    authJwt.verifyToken(JWT_SECRET),
    param("memberId").not().isEmpty().isMongoId(),
    param("bigNum").optional({ nullable: true }).isMongoId(),
    param("smallNum").optional({ nullable: true }).isMongoId(),
  ],
  manseController.calculate
);

module.exports = router;
