import json
import ephem
import math
from lunar_python import Solar
from datetime import datetime, timedelta

# Load manses.json
with open("manses.json", "r", encoding="utf-8") as file:
    manses_data = json.load(file)

# Mapping of Solar Terms (절기) with English Translations
SOLAR_TERMS = {
    "立春": ("Start of Spring", 315),
    "雨水": ("Rain Water", 330),
    "惊蛰": ("Awakening of Insects", 345),
    "春分": ("Spring Equinox", 0),
    "清明": ("Clear and Bright", 15),
    "谷雨": ("Grain Rain", 30),
    "立夏": ("Start of Summer", 45),
    "小满": ("Grain Full", 60),
    "芒种": ("Grain in Ear", 75),
    "夏至": ("Summer Solstice", 90),
    "小暑": ("Minor Heat", 105),
    "大暑": ("Major Heat", 120),
    "立秋": ("Start of Autumn", 135),
    "处暑": ("Limit of Heat", 150),
    "白露": ("White Dew", 165),
    "秋分": ("Autumn Equinox", 180),
    "寒露": ("Cold Dew", 195),
    "霜降": ("Frost Descent", 210),
    "立冬": ("Start of Winter", 225),
    "小雪": ("Minor Snow", 240),
    "大雪": ("Major Snow", 255),
    "冬至": ("Winter Solstice", 270),
    "小寒": ("Minor Cold", 285),
    "大寒": ("Major Cold", 300),
}

def get_season_from_term(term):
    if term in ["立春", "雨水", "惊蛰", "春分", "清明", "谷雨"]:
        return "Spring"
    elif term in ["立夏", "小满", "芒种", "夏至", "小暑", "大暑"]:
        return "Summer"
    elif term in ["立秋", "处暑", "白露", "秋分", "寒露", "霜降"]:
        return "Autumn"
    elif term in ["立冬", "小雪", "大雪", "冬至", "小寒", "大寒"]:
        return "Winter"
    else:
        return None

# Function to get the correct Lunar Date
def get_lunar_date(solar_date):
    year, month, day = map(int, solar_date.split("-"))
    lunar = Solar.fromYmd(year, month, day).getLunar()

    # Leap check via negative month
    month_value = lunar.getMonth()
    is_leap = month_value < 0
    month_abs = abs(month_value)

    print(f"{solar_date} → lunar: {lunar}, leap: {is_leap}")

    return {
        "lunarDate": f"{lunar.getYear()}-{month_abs:02d}-{lunar.getDay():02d}",  # No "L" prefix
        "leapMonth": 1 if is_leap else 0,
        "season": month_abs  # just placeholder
    }





# Function to find the closest solar term (Season Start Time)
def ephem_date_to_local_str(ephem_date, offset_hours=9):
    utc_datetime = ephem.Date(ephem_date).datetime()
    local_datetime = utc_datetime + timedelta(hours=offset_hours)
    return local_datetime.isoformat()  # Ensures ISO 8601 format



def get_season_start_time(solar_date):
    year, month, day = map(int, solar_date.split("-"))
    observer = ephem.Observer()
    observer.date = f"{year}/{month}/{day}"

    start_date = ephem.Date(observer.date)
    end_date = ephem.Date(observer.date + 15)  # search 15 days ahead

    best_match = None
    best_diff = float('inf')
    closest_term = None

    for chinese_name, (english_name, target_angle) in SOLAR_TERMS.items():
        current = start_date
        while current < end_date:
            sun = ephem.Sun(current)
            sun.compute(current)
            current_angle = float(sun.hlong) * (180.0 / math.pi)
            current_angle %= 360
            target_angle %= 360

            # circular diff
            diff = min(abs(current_angle - target_angle), 360 - abs(current_angle - target_angle))
            if diff < 1.0 and diff < best_diff:
                best_diff = diff
                best_match = current
                closest_term = (chinese_name, english_name)
            current += ephem.hour * 6

    return {
        "solarTermChinese": closest_term[0] if closest_term else None,
        "solarTermEnglish": closest_term[1] if closest_term else None,
        "seasonStartTime": ephem_date_to_local_str(best_match) if best_match else None,
    }

# Process each entry in manses.json
for entry in manses_data:
    solar_date = entry["solarDate"]

    # Get lunar and leapMonth
    lunar_info = get_lunar_date(solar_date)
    entry["lunarDate"] = lunar_info["lunarDate"]
    entry["leapMonth"] = lunar_info["leapMonth"]

    # Get solar term info
    season_info = get_season_start_time(solar_date)
    entry["solarTermChinese"] = season_info["solarTermChinese"]
    entry["solarTermEnglish"] = season_info["solarTermEnglish"]
    entry["seasonStartTime"] = season_info["seasonStartTime"]

    # Derive season
    entry["season"] = get_season_from_term(entry["solarTermChinese"])

# Save updated manses.json
with open("manses_filled.json", "w", encoding="utf-8") as file:
    json.dump(manses_data, file, ensure_ascii=False, indent=4)

print("✅ manses_filled.json has been created with updated lunar dates and season start times!")
