const authJwt = require("./verify-jwt-token");
const apiLimiter = process.env.NODE_ENV === "prod" ? require("./api-limit").limit : [];
const JWT_SECRET = process.env.JWT_SECRET;
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller.js");
const { body } = require("express-validator");

/**
 * [회원]
 */

//회원가입
router.post(
  "/signup",
  [
    apiLimiter,
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("type").isIn(["USER", "MEMBER"]),
    body("nickname").notEmpty(),
    body("gender").isIn(["MALE", "FEMALE"]),
    body("birthday").isISO8601(), // ISO format like "1991-02-06"
    body("birthdayType").isIn(["SOLAR", "LUNAR"]),
    body("time").optional().matches(/^([01]\d|2[0-3]):?([0-5]\d)$/) // matches "12:00", "23:59", etc.
  ],
  userController.signup
);

//로그인
router.post(
  "/signin",
  [
    apiLimiter,
    body("email").not().isEmpty().isEmail(),
    body("password").not().isEmpty().isLength({ min: 4, max: 100 }),
  ],
  userController.signin
);

//내정보 가져오기
router.get("/me", [apiLimiter, authJwt.verifyToken(JWT_SECRET)], userController.me);

module.exports = router;
