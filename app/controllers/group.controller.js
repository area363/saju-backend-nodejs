const { Group, GroupMember } = require("../models");
const { validationResult } = require("express-validator");

/**
 * 그룹 추가 (Add Group)
 */
exports.addGroup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const { name } = req.body;
  const userId = req.userId;

  try {
    const group = new Group({ userId, name });
    await group.save();

    return res.status(201).send({
      statusCode: 201,
      message: "그룹 추가 성공",
    });
  } catch (err) {
    next(`${req.method} ${req.url} : ` + err);
  }
};

/**
 * 그룹 리스트 (Get Groups)
 */
exports.getGroups = async (req, res, next) => {
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
    const totalItems = await Group.countDocuments({ userId });

    const groups = await Group.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: "groupmembers",
          localField: "_id",
          foreignField: "groupId",
          as: "members",
        },
      },
      {
        $addFields: {
          memberCount: { $size: "$members" },
        },
      },
      {
        $project: {
          id: "$_id",
          name: 1,
          createdAt: 1,
          memberCount: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: page * size },
      { $limit: size },
    ]);

    return res.status(200).send({
      statusCode: 200,
      message: "그룹 리스트 성공",
      data: {
        totalItems,
        totalPages: Math.ceil(totalItems / size),
        currentPage: page,
        groupList: groups,
      },
    });
  } catch (err) {
    next(`${req.method} ${req.url} : ` + err);
  }
};

/**
 * 그룹 수정 (Update Group)
 */
exports.updateGroup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const userId = req.userId;
  const groupId = req.params.id;
  const { name } = req.body;

  try {
    const group = await Group.findOne({ _id: groupId, userId });

    if (!group) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 그룹의 수정 권한이 없습니다.",
      });
    }

    group.name = name;
    await group.save();

    return res.status(200).send({
      statusCode: 200,
      message: "그룹 수정 성공",
    });
  } catch (err) {
    next(`${req.method} ${req.url} : ` + err);
  }
};

/**
 * 그룹 삭제 (Delete Group)
 */
exports.deleteGroup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const userId = req.userId;
  const groupId = req.params.id;

  try {
    const group = await Group.findOne({ _id: groupId, userId });

    if (!group) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 그룹의 삭제 권한이 없습니다.",
      });
    }

    await GroupMember.deleteMany({ groupId });
    await Group.deleteOne({ _id: groupId });

    return res.status(200).send({
      statusCode: 200,
      message: "그룹 삭제 성공",
    });
  } catch (err) {
    next(`${req.method} ${req.url} : ` + err);
  }
};

/**
 * 그룹명 리스트 (Get Group Names)
 */
exports.getGroupNames = async (req, res, next) => {
  const userId = req.userId;

  try {
    const groups = await Group.find({ userId }).sort({ createdAt: -1 }).select("id name");

    return res.status(200).send({
      statusCode: 200,
      message: "그룹명 리스트 성공",
      data: groups,
    });
  } catch (err) {
    next(`${req.method} ${req.url} : ` + err);
  }
};
