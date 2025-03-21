const { GroupMember, Group, Member } = require("../models");
const { validationResult } = require("express-validator");

/**
 * 그룹에 멤버 추가 (Add Member to Group)
 */
exports.addMemberToGroup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const groupId = req.params.groupId;
  const memberId = req.params.memberId;
  const userId = req.userId;

  try {
    const group = await Group.findOne({ _id: groupId, userId });

    if (!group) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 그룹에 멤버 추가 권한이 없습니다.",
      });
    }

    const member = await Member.findOne({ _id: memberId, userId });

    if (!member) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 그룹에 멤버 추가 권한이 없습니다.",
      });
    }

    const existingGroupMember = await GroupMember.findOne({ groupId, memberId });

    if (existingGroupMember) {
      return res.status(409).send({
        statusCode: 409,
        message: "해당 그룹에 같은 멤버가 존재합니다.",
      });
    }

    const groupMember = new GroupMember({ groupId, memberId });
    await groupMember.save();

    return res.status(201).send({
      statusCode: 201,
      message: "그룹에 멤버 추가 성공",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 그룹 별 멤버 리스트 (Get Group Member List)
 */
exports.getGroupMemberList = async (req, res, next) => {
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
  const groupId = req.params.groupId;

  try {
    const group = await Group.findOne({ _id: groupId, userId });
    if (!group) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 그룹에 대한 권한 없습니다.",
      });
    }

    const totalItems = await GroupMember.countDocuments({ groupId });

    const groupMembers = await GroupMember.find({ groupId })
      .populate({
        path: "member",
        select: "id type nickname birthday birthdayType gender time createdAt",
      })
      .sort({ createdAt: -1 })
      .skip(page * size)
      .limit(size);

    // Step 1: Collect all member IDs
    const memberIds = groupMembers.map((gm) => gm.member._id);

    // Step 2: Fetch all Manses in one query
    const manses = await Manse.find({ memberId: { $in: memberIds } });
    const manseMap = new Map(manses.map((m) => [String(m.memberId), m]));

    // Step 3: Format each member + saju
    const formattedMembers = [];

    for (const gm of groupMembers) {
      const member = gm.member;
      const manse = manseMap.get(String(member._id));
      if (!manse) continue;

      const formatted = await sajuService.convertMemberToManse(member, manse);
      formattedMembers.push(formatted);
    }

    return res.status(200).send({
      statusCode: 200,
      message: "그룹별 멤버 리스트 성공",
      data: {
        totalItems,
        totalPages: Math.ceil(totalItems / size),
        currentPage: page,
        members: formattedMembers,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 그룹에서 멤버 제거 (Remove Member from Group)
 */
exports.removeMemberFromGroup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      statusCode: 400,
      message: "잘못된 요청값 입니다.",
      error: errors.array(),
    });
  }

  const userId = req.userId;
  const groupId = req.params.groupId;
  const memberId = req.params.memberId;

  try {
    const group = await Group.findOne({ _id: groupId, userId });

    if (!group) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 그룹에서 멤버 제거 권한이 없습니다.",
      });
    }

    const member = await Member.findOne({ _id: memberId, userId });

    if (!member) {
      return res.status(403).send({
        statusCode: 403,
        message: "해당 그룹에서 멤버 제거 권한이 없습니다.",
      });
    }

    await GroupMember.deleteOne({ groupId, memberId });

    return res.status(200).send({
      statusCode: 200,
      message: "그룹에서 멤버 제거 성공",
    });
  } catch (err) {
    next(err);
  }
};
