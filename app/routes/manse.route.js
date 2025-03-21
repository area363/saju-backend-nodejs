const express = require("express");
const { param, query, body } = require("express-validator");
const router = express.Router();

const authJwt = require("./verify-jwt-token");
const apiLimiter = process.env.NODE_ENV === "prod" ? require("./api-limit").limit : [];
const JWT_SECRET = process.env.JWT_SECRET;

const manseController = require("../controllers/manse.controller.js");
const sajuService = require("../services/saju.js");

// ✅ GET 사주 for a saved member (requires login)
router.get(
  "/members/:memberId/fortune",
  [
    apiLimiter,
    authJwt.verifyToken(JWT_SECRET),
    param("memberId").not().isEmpty().isMongoId(),
    query("bigNum").optional().isInt(),
    query("smallNum").optional().isInt()
  ],
  manseController.calculate
);

// ✅ NEW: Direct Saju Calculation (no auth, no save)
router.post(
  "/calculate",
  [
    body("birthday").not().isEmpty().isString(),
    body("time").optional().isString(),
    body("gender").not().isEmpty().isIn(["MALE", "FEMALE"]),
    body("birthdayType").not().isEmpty().isIn(["SOLAR", "LUNAR"])
  ],
  async (req, res) => {
    try {
      const member = {
        birthday: req.body.birthday,
        time: req.body.time || null,
        gender: req.body.gender,
        birthdayType: req.body.birthdayType,
        nickname: "Temporary",
        createdAt: new Date()
      };

      const memberManse = await sajuService.convertBirthtimeToSaju(member);
      const result = await sajuService.convertMemberToSaju(member, memberManse);

      return res.status(200).json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Error calculating saju",
        error: err.message
      });
    }
  }
);

module.exports = router;
