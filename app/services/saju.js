// app/services/saju.js
const mongoose = require("mongoose");
const { Manse, MemberManse } = require("../models");
const sajuDataService = require("../commons/saju-data"); // ✅ correct path
const moment = require("moment");

/**
 * 생년월일시를 사주로 변환
 */
exports.convertBirthtimeToSaju = async (member) => {
  const samju = await this.convertBirthToSamju(member.birthdayType, member.birthday, member.time);
  let solarDatetime = samju.solarDate + " " + (member.time || "12:00:00");
  const direction = await this.isRightDirection(member.gender, samju.yearSky);
  const seasonTime = await this.getSeasonStartTime(direction, solarDatetime);
  const bigFortune = await this.getBigFortuneNumber(direction, seasonTime, moment(solarDatetime));
  const timeJu = await this.getTimePillar(samju.daySky, member.time);

  await MemberManse.findOneAndUpdate(
    { memberId: member._id || new mongoose.Types.ObjectId() },
    {
      yearSky: samju.yearSky,
      yearGround: samju.yearGround,
      monthSky: samju.monthSky,
      monthGround: samju.monthGround,
      daySky: samju.daySky,
      dayGround: samju.dayGround,
      timeSky: timeJu.timeSky,
      timeGround: timeJu.timeGround,
      bigFortuneNumber: bigFortune.bigFortuneNumber,
      bigFortuneStartYear: bigFortune.bigFortuneStart,
      seasonStartTime: samju.seasonStartTime,
    },
    { upsert: true, new: true }
  );

  return await MemberManse.findOne({ memberId: member._id });
};

exports.convertBirthToSamju = async (birthdayType, birthday, time) => {
  if (time >= "23:30" && time <= "23:59") {
    birthday = moment(birthday).add(1, "days").format("YYYY-MM-DD");
  }
  const condition = birthdayType === "SOLAR" ? { solarDate: birthday } : { lunarDate: birthday };
  const samju = await Manse.findOne(condition);

  if (samju?.season) {
    const solarDatetime = moment(birthday + " " + (time || "12:00"));
    const seasonTime = moment(samju.seasonStartTime);
    const diff = moment.duration(solarDatetime.diff(seasonTime)).asHours();

    if (diff < 0) {
      const prevDay = moment(birthday).subtract(1, "days").format("YYYY-MM-DD");
      const manse = await Manse.findOne({ solarDate: prevDay });
      Object.assign(samju, manse.toObject());
    }
  }

  return samju;
};

exports.isRightDirection = async (gender, yearSky) => {
  const minusPlus = sajuDataService.getMinusPlus()[yearSky];
  return (gender === "MALE" && minusPlus === "양") || (gender === "FEMALE" && minusPlus === "음");
};

exports.getSeasonStartTime = async (direction, solarDatetime) => {
  const query = direction
    ? { seasonStartTime: { $gte: solarDatetime } }
    : { seasonStartTime: { $lte: solarDatetime } };

  return await Manse.findOne(query).sort({ solarDate: direction ? 1 : -1 });
};

exports.getBigFortuneNumber = async (direction, seasonStartTime, solarDatetime) => {
  const diffTime = direction
    ? moment.duration(seasonStartTime.diff(solarDatetime)).asDays()
    : moment.duration(solarDatetime.diff(seasonStartTime)).asDays();

  let bigFortuneNumber = Math.floor(diffTime / 3);
  if (diffTime < 4) bigFortuneNumber = 1;
  if (Math.floor(diffTime) % 3 === 2) bigFortuneNumber += 1;

  const bigFortuneStart = solarDatetime.add(bigFortuneNumber, "years").format("YYYY");
  return { bigFortuneNumber, bigFortuneStart };
};

exports.getTimePillar = (daySky, time) => {
  let timeSky = null, timeGround = null;

  if (time) {
    const timeJuData = sajuDataService.getTimeJuData();
    const timeJuData2 = sajuDataService.getTimeJuData2();
    let index = null;

    for (const key in timeJuData) {
      const [start, end] = timeJuData[key];
      if ((time >= start && time <= end) || (key === "0" && (time >= "23:30" || time <= "01:29"))) {
        index = key;
        break;
      }
    }

    if (index) {
      timeSky = timeJuData2[daySky][index][0];
      timeGround = timeJuData2[daySky][index][1];
    }
  }

  return { timeSky, timeGround };
};
