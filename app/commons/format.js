const { Manse } = require("../models");
const sajuDataService = require("./saju-data");
const fortuneService = require("./fortune.js");
const minusPlusData = sajuDataService.getMinusPlus();
const tenStarData = sajuDataService.getTenStar();
console.log("DEBUG: Loaded tenStarData keys:", Object.keys(tenStarData));
const koreanData = sajuDataService.convertChineseToKorean();
const jijangganData = sajuDataService.getJijangan();
const moment = require("moment");

/**
 * 멤버를 만세력 포맷 변환
 */
exports.convertMemberToManse = async function (member, memberManse, clickBigFortune = null, clickSmallFortune = null) {
  if (!memberManse?.monthSky || !memberManse?.monthGround) {
    throw new Error("❌ monthSky or monthGround is missing in memberManse");
  }

  let format = {};
  //멤버
  format["member"] = this.formatMember(member);
  //사주원국
  format["saju"] = this.formatSaju(memberManse);

  //****************** 대운 ******************/
  console.log("🔍 memberManse before fortune calc:", memberManse);
  const fortunes = fortuneService.listBigFortune(
    member.gender,
    memberManse.yearSky,
    memberManse.monthSky,
    memberManse.monthGround,
    memberManse.bigFortuneNumber
  );
  const bigFortunes = this.formatBigFortune(fortunes, memberManse.daySky);

  const age = this.convertBirthToAge(member.birthday);
  //올해 나이 기준으로 현재 대운 계산
  let index = null;
  for (const i in bigFortunes) {
    if (i === 0) continue;
    if (bigFortunes[String(i)]["number"] > age) {
      index = i - 1;
      break;
    }
  }

  //****************** 세운 ******************/
  let start = null;
  let end = null;
  if (!clickBigFortune) {
    //디폴트 대운에 의한 세운 10개
    start = memberManse.bigFortuneStartYear + (index - 1) * 10 - 1;
    end = start + 9;
  } else {
    //클릭 대운에 의한 세운 10개
    start = memberManse.bigFortuneStartYear + (clickBigFortune - 1) * 10 - 1;
    end = start + 9;
  }

  //현재 운
  format["fortune"] = {
    big: clickBigFortune ? clickBigFortune : index,
    small: start,
  };

  const smallFortunelist = fortuneService.listSmallFortune(start, end);
  const smallFortunes = this.formatSmallFortune(smallFortunelist, memberManse.daySky);

  //****************** 월운 ******************/
  const yearForMonth = clickSmallFortune ? clickSmallFortune : start;
  const monthFortunelist = fortuneService.listMonthFortune(yearForMonth);
  const monthFortunes = this.formatMonthFortune(monthFortunelist, memberManse.daySky);

  //운 리스트
  format["list"] = {
    bigFortune: bigFortunes,
    smallFortune: smallFortunes,
    monthFortune: monthFortunes,
  };

  return format;
};

/**
 * 멤버를 사주 포맷 변환
 */
exports.convertMemberToSaju = async (member, memberManse) => {
  let format = {};

  // 🚨 Guard clause for missing manse
  if (!memberManse || !memberManse.monthSky || !memberManse.monthGround || !memberManse.yearSky) {
    throw new Error(`Invalid or missing memberManse data: ${JSON.stringify(memberManse)}`);
  }

  format["member"] = this.formatMember(member);
  format["saju"] = this.formatSaju(memberManse);

  //****************** 대운 ******************/
  console.log("🔍 memberManse before fortune calc:", memberManse);
  const fortunes = fortuneService.listBigFortune(
    member.gender,
    memberManse.yearSky,
    memberManse.monthSky,
    memberManse.monthGround,
    memberManse.bigFortuneNumber
  );

  const currentYear = moment().format("YYYY");
  const currentDay = moment().format("YYYY-MM-DD");

  const bigFortunes = this.formatBigFortune(fortunes, memberManse.daySky);
  const age = this.convertBirthToAge(member.birthday);

  let index = null;
  for (const i in bigFortunes) {
    if (i === 0) continue;
    if (bigFortunes[String(i)]["number"] > age) {
      index = i - 1;
      break;
    }
  }

  const currentFortune = await Manse.findOne({ solarDate: currentDay });
  const convertedFortune = await this.formatFortune(memberManse.daySky, currentFortune);

  format["fortune"] = {
    bigFortune: bigFortunes[String(index)],
    smallFortune: {
      number: currentYear,
      sky: convertedFortune.yearSky,
      ground: convertedFortune.yearGround,
    },
    monthFortune: {
      number: new Date().getMonth() + 1,
      sky: convertedFortune.monthSky,
      ground: convertedFortune.monthGround,
    },
    dayFortune: {
      number: new Date().getDate(),
      sky: convertedFortune.daySky,
      ground: convertedFortune.dayGround,
    },
  };

  return format;
};


//생일을 나이로 변환
exports.convertBirthToAge = (birth) => {
  const year = moment(birth).year();
  const currentYear = new Date().getFullYear();
  const age = currentYear - Number(year) + 1;
  return age;
};

//회원 포맷
exports.formatMember = (member) => {
  return {
    id: member.id,
    nickname: member.nickname,
    age: this.convertBirthToAge(member.birthday),
    birthday: member.birthday,
    time: member.time,
    birthdayType: member.birthdayType,
    gender: member.gender,
    createdAt: member.createdAt,
  };
};

//사주 포맷
exports.formatSaju = (saju) => {
  if (Array.isArray(saju)) {
    saju = saju[0]; // Take the first element
  }

  if (!saju || !saju.daySky) {
    console.error("❌ ERROR: saju data is missing or improperly formatted.");
    return null;
  }

  console.log("DEBUG formatSaju (after unwrap) received:", saju);

  const tenStar = tenStarData[saju.daySky];

  if (!tenStar) {
    console.error(`❌ ERROR: No tenStar data found for daySky: ${saju.daySky}`);
    return null;
  }

  return {
    bigFortuneNumber: saju.bigFortuneNumber,
    bigFortuneStartYear: saju.bigFortuneStartYear,
    seasonStartTime: saju.seasonStartTime,
    yearSky: this.formatChinese(saju.yearSky, tenStar),
    yearGround: this.formatChinese(saju.yearGround, tenStar, true),
    monthSky: this.formatChinese(saju.monthSky, tenStar),
    monthGround: this.formatChinese(saju.monthGround, tenStar, true),
    daySky: this.formatChinese(saju.daySky, tenStar),
    dayGround: this.formatChinese(saju.dayGround, tenStar, true),
    timeSky: saju.timeSky ? this.formatChinese(saju.timeSky, tenStar) : null,
    timeGround: saju.timeGround ? this.formatChinese(saju.timeGround, tenStar, true) : null,
  };
};



exports.formatChinese = (chinese, tenStar, isGround = false) => {
  console.log(`DEBUG formatChinese input -> Chinese: ${chinese}, TenStarData:`, tenStar);

  if (!tenStar || !chinese || !tenStar[chinese]) {
    console.warn(`❌ tenStar data is missing for: ${chinese}`);
    return {
      chinese,
      korean: koreanData[chinese] || null,
      fiveCircle: null,
      fiveCircleColor: null,
      tenStar: null,
      minusPlus: minusPlusData[chinese] || null,
      jijangGan: isGround === true ? jijangganData[chinese] || null : null,
    };
  }

  const data = tenStar[chinese];
  return {
    chinese: chinese,
    korean: koreanData[chinese],
    fiveCircle: data["1"],
    fiveCircleColor: this.getColor(data["1"]),
    tenStar: data["0"],
    minusPlus: minusPlusData[chinese],
    jijangGan: isGround === true ? jijangganData[chinese] : null,
  };
};





exports.getColor = (value) => {
  color = "";

  if (value === "목") {
    color = "#4CAF50";
  } else if (value === "화") {
    color = "#F44336";
  } else if (value === "토") {
    color = "#FFD600";
  } else if (value === "금") {
    color = "#E0E0E0";
  } else if (value === "수") {
    color = "#039BE5";
  }

  return color;
};

//대운 포맷
exports.formatBigFortune = (fortunes, daySky) => {
  const tenStar = tenStarData[daySky];
  let format = {};

  for (const i in fortunes) {
    format[i] = {
      number: fortunes[i].bigFortuneNumber,
      sky: this.formatChinese(fortunes[i].monthSky, tenStar),
      ground: this.formatChinese(fortunes[i].monthGround, tenStar, true),
    };
  }

  return format;
};

//운세 포맷 (연월일 운)
exports.formatFortune = (daySky, fortune) => {
  const tenStar = tenStarData[daySky];

  return {
    yearSky: this.formatChinese(fortune.yearSky, tenStar),
    yearGround: this.formatChinese(fortune.yearGround, tenStar, true),
    monthSky: this.formatChinese(fortune.monthSky, tenStar),
    monthGround: this.formatChinese(fortune.monthGround, tenStar, true),
    daySky: this.formatChinese(fortune.daySky, tenStar),
    dayGround: this.formatChinese(fortune.dayGround, tenStar, true),
  };
};

//세운 포맷
exports.formatSmallFortune = (fortunes, daySky) => {
  const tenStar = tenStarData[daySky];
  let format = {};
  for (const i in fortunes) {
    format[i] = {
      year: fortunes[i].year,
      sky: this.formatChinese(fortunes[i].sky, tenStar),
      ground: this.formatChinese(fortunes[i].ground, tenStar, true),
    };
  }
  return format;
};

//월운 포맷
exports.formatMonthFortune = (fortunes, daySky) => {
  const tenStar = tenStarData[daySky];
  let format = {};
  for (const i in fortunes) {
    format[i] = {
      month: fortunes[i].month,
      sky: this.formatChinese(fortunes[i].sky, tenStar),
      ground: this.formatChinese(fortunes[i].ground, tenStar),
    };
  }
  return format;
};
