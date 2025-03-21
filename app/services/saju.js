// app/services/saju.js
const mongoose = require("mongoose");
const { Manse, MemberManse } = require("../models");
const sajuDataService = require("../commons/saju-data"); // ✅ correct path
const moment = require("moment");
const { convertBirthToSamju } = require("../commons/birth-to-saju");  // ✅ Correct way

/**
 * 생년월일시를 사주로 변환
 */
exports.convertBirthtimeToSaju = async (member) => {
    console.log("🚀 Using convertBirthToSamju from:", require.resolve("../commons/birth-to-saju"));
    const samju = await convertBirthToSamju(member.birthdayType, member.birthday, member.time);
    let solarDatetime;

    if (samju.solarDate instanceof Date) {
        const time = member.time || "12:00";
        const formatted = moment(samju.solarDate).format("YYYY-MM-DD") + " " + time;
        solarDatetime = moment(formatted, "YYYY-MM-DD HH:mm").toDate();
    } else {
        // fallback in case solarDate is string
        const formatted = moment(samju.solarDate, "YYYY-MM-DD").format("YYYY-MM-DD") + " " + (member.time || "12:00");
        solarDatetime = moment(formatted, "YYYY-MM-DD HH:mm").toDate();
    }


    const direction = await this.isRightDirection(member.gender, samju.yearSky);
    const seasonTime = await this.getSeasonStartTime(direction, solarDatetime);
    const bigFortune = await this.getBigFortuneNumber(direction, seasonTime, moment(solarDatetime));
    const timeJu = this.getTimePillar(samju.daySky, member.time);

    console.log("📦 Saving MemberManse:", {
        memberId: member._id || new mongoose.Types.ObjectId(),
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
    });



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

    const bigFortuneStart = moment(solarDatetime).add(bigFortuneNumber, "years").year(); // ← use moment to safely get number
    return { bigFortuneNumber, bigFortuneStart };
};


exports.getTimePillar = (daySky, time) => {
    let timeSky = null, timeGround = null;
  
    if (time) {
      const timeJuData = sajuDataService.getTimeJuData();
      const timeJuData2 = sajuDataService.getTimeJuData2();
  
      console.log("🧪 timeJuData:", timeJuData);
      console.log("🧪 timeJuData2:", timeJuData2);
  
      let index = null;
  
      for (const key in timeJuData) {
        const value = timeJuData[key];
  
        // Safely extract start and end from object keys '0' and '1'
        const start = value['0'];
        const end = value['1'];
  
        console.log("🔍 key:", key, "| start:", start, "| end:", end);
  
        if (
          (time >= start && time <= end) ||
          (key === "0" && (time >= "23:30" || time <= "01:29"))
        ) {
          index = key;
          break;
        }
      }
  
      if (index && timeJuData2[daySky] && timeJuData2[daySky][index]) {
        timeSky = timeJuData2[daySky][index]['0'];
        timeGround = timeJuData2[daySky][index]['1'];
      }
    }
  
    return { timeSky, timeGround };
  };
  
  
