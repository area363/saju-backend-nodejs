const mongoose = require("mongoose");
const { Manse, MemberManse } = require("../models");
const sajuDataService = require("./saju-data");
const moment = require("moment");

/**
 * 생년월일시를 사주로 변환
 */
exports.convertBirthtimeToSaju = async (member) => {
  //(1) 생년월일을 삼주(양력)로 변환
  const samju = await this.convertBirthToSamju(member.birthdayType, member.birthday, member.time);

  //(2) 생년월일시(양력) 생성
  const dateOnly = moment(samju.solarDate).format("YYYY-MM-DD");
  const solarDatetime = moment(`${dateOnly} ${member.time || "12:00"}`, "YYYY-MM-DD HH:mm").toDate();

  //(3) 순행(true), 역행(false) 판단
  const direction = await this.isRightDirection(member.gender, samju.yearSky);

  //(4) 절입시간 가져오기
  const seasonTime = await this.getSeasonStartTime(direction, solarDatetime);

  //(5) 대운수 및 대운 시작년 가져오기
  const bigFortune = await this.getBigFortuneNumber(direction, seasonTime, moment(solarDatetime));

  //(6) 시주 가져오기
  const timeJu = await this.getTimePillar(samju.daySky, member.time);

  //(7) 멤버-만세력 테이블에 대운수 및 시주 저장 & 수정
  await MemberManse.findOneAndUpdate(
    { memberId: member._id },  // ✅ Use `_id` instead of `id`
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
};
/**
 * 생년월일을 삼주로 변환
 * 절입일 예외처리 : 시간 미입력시 12:00
 */
exports.convertBirthToSamju = async (birthdayType, birthday, time) => {
  const birthtime = time === null ? "12:00" : time;
  if (time >= "23:30" && time <= "23:59") {
    birthday = moment(birthday).add(1, "days").format("YYYY-MM-DD");
  }

  const condition = birthdayType === "SOLAR" ? { solarDate: birthday } : { lunarDate: birthday };

  const samju = await Manse.findOne(condition);

  //절입일인 경우
  if (samju.season) {
    const seasonTime = moment(samju.seasonStartTime);
    const solarDatetime = moment(birthday + " " + birthtime);
    const diff = moment.duration(solarDatetime.diff(seasonTime)).asHours(); 

    if (diff < 0) {
      const manse = await Manse.findOne({
        solarDate: moment(birthday).add(-1, "days").format("YYYY-MM-DD"),
      });
    
      if (manse) {
        Object.assign(samju, manse.toObject());
        samju.seasonStartTime = manse.seasonStartTime; // ✅ Explicitly assign seasonStartTime
      }
    }
  }

  console.log("🛠 Final Samju Data:", JSON.stringify(samju, null, 2));
  return samju;
};

/**
 * 순행(true), 역행(false) 판단 (성별, 연간)
 */
exports.isRightDirection = async (gender, yearSky) => {
  const minusPlus = await sajuDataService.getMinusPlus()[yearSky];
  //남양여음 순행, 남음여양 역행
  if ((gender === "MALE" && minusPlus === "양") || (gender === "FEMALE" && minusPlus === "음")) {
    return true;
  } else if ((gender === "FEMALE" && minusPlus === "양") || (gender === "MALE" && minusPlus === "음")) {
    return false;
  }
};

/**
 * 절입 시간 가져오기
 * 순행은 생년월일 뒤에 오는 절입 시간을 가져온다.
 * 역행은 생년월일 앞에 오는 절입 시간을 가져온다.
 * 예를 들어 2월 13일이 순행인 경우 3월 6일(경칩)을 가져온다.
 * 2월 13일이 역행인 경우 2월 4일(입춘)을 가져온다.
 */
exports.getSeasonStartTime = async (direction, solarDatetime) => {
  const condition1 = direction ? { seasonStartTime: { $gte: solarDatetime } } : { seasonStartTime: { $lte: solarDatetime } };
  return await Manse.findOne(condition1).sort({ solarDate: direction ? 1 : -1 });
};

/**
 * 대운수 및 대운 시작 구하기
 */
exports.getBigFortuneNumber = async (direction, seasonStartTime, solarDatetime) => {
  const diffTime =
    direction === true
      ? moment.duration(seasonStartTime.diff(solarDatetime)).asDays() //순행
      : moment.duration(solarDatetime.diff(seasonStartTime)).asDays(); //역행

  const divider = Math.floor(diffTime / 3);
  const demainder = Math.floor(diffTime) % 3;

  let bigFortuneNumber = divider;
  if (diffTime < 4) {
    bigFortuneNumber = 1;
  }

  if (demainder === 2) {
    bigFortuneNumber += 1;
  }
  const bigFortuneStart = solarDatetime.add(bigFortuneNumber, "years").format("YYYY");

  return {
    bigFortuneNumber, //대운수
    bigFortuneStart, //대운 시작년
  };
};

/**
 * 시주 계산하기
 */
exports.getTimePillar = (daySky, time) => {
  //시간이 없는 경우 null 처리
  let timeSky = null;
  let timeGround = null;

  //시간이 있는 경우 처리
  if (time) {
    let index = null;
    const timeJuData = sajuDataService.getTimeJuData(); //시간 범위
    const timeJuData2 = sajuDataService.getTimeJuData2(); //일간 및 시간에 따른 시주

    for (const key in timeJuData) {
      const strKey = String(key);

      if (time >= timeJuData[strKey]["0"] && time <= timeJuData[strKey]["1"]) {
        index = strKey;
        break;
      } else if ((time >= "23:30" && time <= "23:59") || (time >= "00:00" && time <= "01:29")) {
        // 0 => ['23:30:00', '01:30:00'],  //자시
        index = strKey;
        break;
      }
    }
    //일간
    timeSky = timeJuData2[daySky][index][0];
    timeGround = timeJuData2[daySky][index][1];
  }

  return {
    timeSky,
    timeGround,
  };
};
