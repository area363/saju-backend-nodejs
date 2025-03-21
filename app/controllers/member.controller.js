const { Member, MemberManse } = require("../models");
const SajuService = require("../commons/birth-to-saju.js");
const { validationResult } = require("express-validator");

/**
 * 멤버 추가 (Add Member)
 */
exports.addMember = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const { nickname, gender, birthdayType, birthday, time } = req.body;
  const userId = req.userId;

  try {
    const member = new Member({
      userId,
      nickname,
      gender,
      birthday,
      birthdayType,
      time,
      type: "MEMBER",
    });
    await member.save();

    // 생년월일시를 사주로 변환
    await SajuService.convertBirthtimeToSaju(member);

    return res.status(201).send({
      statusCode: 201,
      message: "멤버 추가 성공",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 멤버 리스트 (Get Members)
 */
exports.getMembers = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 10;
  const userId = req.userId;

  try {
    const totalItems = await Member.countDocuments({ userId });

    const members = await Member.find({ userId })
      .sort({ createdAt: -1 })
      .skip(page * size)
      .limit(size)
      .select("id type nickname birthday birthdayType gender time createdAt");

    // Step 1: Fetch all related Manses at once
    const manses = await Manse.find({
      memberId: { $in: members.map((m) => m.id) },
    });

    // Step 2: Create a map to quickly find manse by memberId
    const manseMap = new Map(manses.map((m) => [String(m.memberId), m]));

    // Step 3: Build formatted member list
    const formattedMembers = [];

    for (const member of members) {
      const manse = manseMap.get(String(member.id));
      if (!manse) continue;

      const formatted = await sajuService.convertMemberToManse(member, manse);
      formattedMembers.push(formatted);
    }

    const response = {
      totalItems,
      totalPages: Math.ceil(totalItems / size),
      currentPage: page,
      memberList: formattedMembers,
    };

    return res.status(200).send({
      statusCode: 200,
      message: "멤버 리스트 성공",
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 멤버 삭제 (Delete Member)
 */
exports.deleteMember = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const userId = req.userId;
  const memberId = req.params.id;

  try {
    const member = await Member.findOne({ _id: memberId, userId });

    if (!member) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 멤버의 삭제 권한이 없습니다.",
      });
    }

    if (member.type === "USER") {
      return res.status(403).send({
        statusCode: 403,
        message: "본인에 대한 삭제 권한이 없습니다.",
      });
    }

    await MemberManse.deleteOne({ memberId });
    await Member.deleteOne({ _id: memberId });

    return res.status(200).send({
      statusCode: 200,
      message: "멤버 삭제 성공",
    });
  } catch (err) {
    next(err);
  }
};
