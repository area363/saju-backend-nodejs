const { Member, MemberManse } = require("../models");
const formatService = require("../commons/format.js");
const { validationResult } = require("express-validator");

/**
 * 만세력 계산 (Calculate Saju)
 */
exports.calculate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const userId = req.params.userId ? req.params.userId : req.userId;
  const memberId = req.params.memberId;
  const bigNum = req.query.bigNum;
  const smallNum = req.query.smallNum;

  try {
    const member = await Member.findOne({ _id: memberId, userId })
      .select("id nickname gender birthdayType birthday time createdAt")
      .populate({
        path: "manse",
        select: "bigFortuneNumber bigFortuneStartYear seasonStartTime yearSky yearGround monthSky monthGround daySky dayGround timeSky timeGround",
      });      

    if (!member) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 멤버에 대한 접근 권한이 없습니다.",
      });
    }

    console.log("🔍 member:", member);
    console.log("🔍 memberManse:", member.manse);
    const formattedManse = await formatService.convertMemberToManse(member, member.manse, bigNum, smallNum);


    return res.status(200).send({
      statusCode: 200,
      message: "만세력 가져오기 성공",
      data: formattedManse,
    });
  } catch (err) {
    next(err);
  }
};
