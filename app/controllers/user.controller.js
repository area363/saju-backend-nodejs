const { User, Member, MemberManse } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sajuService = require("../commons/birth-to-saju.js");
const formatService = require("../commons/format.js");
const { validationResult } = require("express-validator");

/**
 * 회원가입 (Signup)
 */
exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const { email, password, nickname, gender, birthdayType, birthday, time } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  try {
    const existUserEmail = await User.findOne({ email });

    if (existUserEmail) {
      return res.status(409).send({
        statusCode: 409,
        message: "이미 사용중인 이메일 입니다.",
      });
    }

    const user = new User({
      email,
      password: hashedPassword,
    });
    await user.save();

    const member = new Member({
      userId: user._id,
      type: "USER",
      nickname,
      gender,
      birthday,
      birthdayType,
      time,
    });
    await member.save();

    // 생년월일시를 사주로 변환
    await sajuService.convertBirthtimeToSaju(member);

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(201).send({
      statusCode: 201,
      message: "회원가입 성공",
      data: { accessToken },
    });
  } catch (err) {
    next(`${req.method} ${req.url} : ` + err);
  }
};

/**
 * 로그인 (Signin)
 */
exports.signin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).send({
        statusCode: 401,
        message: "로그인 실패",
      });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        statusCode: 401,
        message: "로그인 실패",
      });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).send({
      statusCode: 200,
      message: "로그인 성공",
      data: { accessToken },
    });
  } catch (err) {
    next(`${req.method} ${req.url} : ` + err);
  }
};

/**
 * 내 정보 보기 (Get My Info)
 */
exports.me = async (req, res, next) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId)
      .select("id")
      .populate({
        path: "members",
        match: { type: "USER" },
        populate: { path: "manse" },
      });

    if (!user || !user.members.length) {
      return res.status(404).send({
        statusCode: 404,
        message: "사용자 정보를 찾을 수 없습니다.",
      });
    }

    const member = user.members[0];
    const memberManse = member.manse;
    const formattedMember = await formatService.convertMemberToSaju(member, memberManse);

    return res.status(200).send({
      statusCode: 200,
      message: "내정보보기 성공",
      data: formattedMember,
    });
  } catch (err) {
    next(`${req.method} ${req.url} : ` + err);
  }
};
