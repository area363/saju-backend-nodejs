const sajuDataService = require("./saju-data.js");

/**
 * 대운 리스트 가져오기
 */
exports.listBigFortune = (sex, yearSky, monthSky, monthGround, bigFortuneNumber) => {
  const minusPlus = sajuDataService.getMinusPlus()[yearSky];

  // ✅ Fix logic: 남양/여음 → 순행, 남음/여양 → 역행
  let direction = null;
  if ((sex === "MALE" && minusPlus === "양") || (sex === "FEMALE" && minusPlus === "음")) {
    direction = true;
  } else {
    direction = false;
  }

  let bigFortunes = {};
  bigFortunes[0] = {
    bigFortuneNumber: null,
    monthSky: monthSky,
    monthGround: monthGround,
  };

  const sixtyGapja = sajuDataService.getSixtyGapjaForBigFortuneList();
  let index = null;

  for (let i in sixtyGapja) {
    if (sixtyGapja[i][0] === monthSky && sixtyGapja[i][1] === monthGround) {
      index = Number(i);
      break;
    }
  }

  // ✅ Fallback if 월주 not found
  if (index === null) {
    throw new Error(`월주 (${monthSky}${monthGround}) not found in 60갑자`);
  }

  let first = index;
  let bigFortuneNumberValue = bigFortuneNumber;
  let count = 1;

  if (direction === true) {
    for (let i = first + 1; count <= 10; i++) {
      const wrappedIndex = (i + 60) % 60;
      bigFortunes[count] = {
        bigFortuneNumber: bigFortuneNumberValue,
        monthSky: sixtyGapja[wrappedIndex][0],
        monthGround: sixtyGapja[wrappedIndex][1],
      };
      bigFortuneNumberValue += 10;
      count++;
    }
  } else {
    for (let i = first - 1; count <= 10; i--) {
      const wrappedIndex = (i + 60) % 60;
      bigFortunes[count] = {
        bigFortuneNumber: bigFortuneNumberValue,
        monthSky: sixtyGapja[wrappedIndex][0],
        monthGround: sixtyGapja[wrappedIndex][1],
      };
      bigFortuneNumberValue += 10;
      count++;
    }
  }

  return bigFortunes;
};


/**
 * 세운 리스트 가져오기
 */
exports.listSmallFortune = (start, end = null) => {
  const index = start % 60;

  if (!end) {
    return {
      year: start,
      sky: sajuDataService.getSixtyGapja()[index][0],
      ground: sajuDataService.getSixtyGapja()[index][1],
    };
  }

  let result = [];
  for (let i = start; i <= end; i++) {
    let index = i % 60;
    arr = {
      year: i,
      sky: sajuDataService.getSixtyGapja()[index][0],
      ground: sajuDataService.getSixtyGapja()[index][1],
    };
    result.push(arr);
  }
  return result;
};

/**
 * 월운 리스트 가져오기
 */
exports.listMonthFortune = function (year) {
  const tenSky = {
    0: "甲",
    1: "乙",
    2: "丙",
    3: "丁",
    4: "戊",
    5: "己",
    6: "庚",
    7: "辛",
    8: "壬",
    9: "癸",
    10: "甲",
    11: "乙",
    12: "丙",
    13: "丁",
    14: "戊",
    15: "己",
    16: "庚",
    17: "辛",
    18: "壬",
    19: "癸",
    20: "甲",
  };
  const tweleveGround = {
    0: "丑",
    1: "寅",
    2: "卯",
    3: "辰",
    4: "巳",
    5: "午",
    6: "未",
    7: "申",
    8: "酉",
    9: "戌",
    10: "亥",
    11: "子",
  };

  let start = null;
  if (year % 10 === 4 || year % 10 === 9) {
    start = "乙";
  } else if (year % 10 === 0 || year % 10 === 5) {
    start = "丁";
  } else if (year % 10 === 1 || year % 10 === 6) {
    start = "己";
  } else if (year % 10 === 2 || year % 10 === 7) {
    start = "辛";
  } else if (year % 10 === 3 || year % 10 === 8) {
    start = "癸";
  }

  let index = null;
  for (let i in tenSky) {
    if (tenSky[i] === start) {
      index = i;
      break;
    }
  }

  let monthFortunes = {};
  for (let i = 0; i < 12; i++) {
    monthFortunes[i] = {
      month: i + 1,
      sky: tenSky[Number(index) + i],
      ground: tweleveGround[i],
    };
  }
  return monthFortunes;
};
