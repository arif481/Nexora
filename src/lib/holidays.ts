export interface HolidayItem {
  id: string;
  name: string;
  date: Date;
  countryCode: string;
}

type SupportedCountryCode = 'US' | 'IN' | 'GB' | 'CA' | 'AU';

const createDate = (year: number, monthIndex: number, dayOfMonth: number): Date => {
  return new Date(year, monthIndex, dayOfMonth, 12, 0, 0, 0);
};

const nthWeekdayOfMonth = (
  year: number,
  monthIndex: number,
  weekday: number,
  nth: number
): Date => {
  const firstDay = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  const firstWeekdayOffset = (7 + weekday - firstDay.getDay()) % 7;
  const dayOfMonth = 1 + firstWeekdayOffset + (nth - 1) * 7;
  return createDate(year, monthIndex, dayOfMonth);
};

const lastWeekdayOfMonth = (year: number, monthIndex: number, weekday: number): Date => {
  const lastDay = new Date(year, monthIndex + 1, 0, 12, 0, 0, 0);
  const offset = (7 + lastDay.getDay() - weekday) % 7;
  return createDate(year, monthIndex, lastDay.getDate() - offset);
};

const formatHolidayId = (countryCode: string, slug: string, date: Date): string => {
  return `${countryCode}_${slug}_${date.toISOString().split('T')[0]}`;
};

const fixedHoliday = (
  countryCode: string,
  slug: string,
  name: string,
  year: number,
  monthIndex: number,
  dayOfMonth: number
): HolidayItem => {
  const date = createDate(year, monthIndex, dayOfMonth);
  return {
    id: formatHolidayId(countryCode, slug, date),
    name,
    date,
    countryCode,
  };
};

const buildUSHolidays = (year: number): HolidayItem[] => {
  const countryCode = 'US';
  const mlkDay = nthWeekdayOfMonth(year, 0, 1, 3);
  const memorialDay = lastWeekdayOfMonth(year, 4, 1);
  const laborDay = nthWeekdayOfMonth(year, 8, 1, 1);
  const thanksgiving = nthWeekdayOfMonth(year, 10, 4, 4);

  return [
    fixedHoliday(countryCode, 'new_year', "New Year's Day", year, 0, 1),
    { id: formatHolidayId(countryCode, 'mlk_day', mlkDay), name: 'Martin Luther King Jr. Day', date: mlkDay, countryCode },
    { id: formatHolidayId(countryCode, 'memorial_day', memorialDay), name: 'Memorial Day', date: memorialDay, countryCode },
    fixedHoliday(countryCode, 'independence_day', 'Independence Day', year, 6, 4),
    { id: formatHolidayId(countryCode, 'labor_day', laborDay), name: 'Labor Day', date: laborDay, countryCode },
    { id: formatHolidayId(countryCode, 'thanksgiving', thanksgiving), name: 'Thanksgiving', date: thanksgiving, countryCode },
    fixedHoliday(countryCode, 'christmas', 'Christmas Day', year, 11, 25),
  ];
};

const buildINHolidays = (year: number): HolidayItem[] => {
  const countryCode = 'IN';
  return [
    fixedHoliday(countryCode, 'new_year', "New Year's Day", year, 0, 1),
    fixedHoliday(countryCode, 'republic_day', 'Republic Day', year, 0, 26),
    fixedHoliday(countryCode, 'independence_day', 'Independence Day', year, 7, 15),
    fixedHoliday(countryCode, 'gandhi_jayanti', 'Gandhi Jayanti', year, 9, 2),
    fixedHoliday(countryCode, 'christmas', 'Christmas Day', year, 11, 25),
  ];
};

const buildGBHolidays = (year: number): HolidayItem[] => {
  const countryCode = 'GB';
  const earlyMayBankHoliday = nthWeekdayOfMonth(year, 4, 1, 1);
  const summerBankHoliday = lastWeekdayOfMonth(year, 7, 1);

  return [
    fixedHoliday(countryCode, 'new_year', "New Year's Day", year, 0, 1),
    { id: formatHolidayId(countryCode, 'early_may_bank_holiday', earlyMayBankHoliday), name: 'Early May Bank Holiday', date: earlyMayBankHoliday, countryCode },
    { id: formatHolidayId(countryCode, 'summer_bank_holiday', summerBankHoliday), name: 'Summer Bank Holiday', date: summerBankHoliday, countryCode },
    fixedHoliday(countryCode, 'christmas', 'Christmas Day', year, 11, 25),
    fixedHoliday(countryCode, 'boxing_day', 'Boxing Day', year, 11, 26),
  ];
};

const buildCAHolidays = (year: number): HolidayItem[] => {
  const countryCode = 'CA';
  const laborDay = nthWeekdayOfMonth(year, 8, 1, 1);
  const thanksgiving = nthWeekdayOfMonth(year, 9, 1, 2);

  return [
    fixedHoliday(countryCode, 'new_year', "New Year's Day", year, 0, 1),
    fixedHoliday(countryCode, 'canada_day', 'Canada Day', year, 6, 1),
    { id: formatHolidayId(countryCode, 'labor_day', laborDay), name: 'Labour Day', date: laborDay, countryCode },
    { id: formatHolidayId(countryCode, 'thanksgiving', thanksgiving), name: 'Thanksgiving', date: thanksgiving, countryCode },
    fixedHoliday(countryCode, 'christmas', 'Christmas Day', year, 11, 25),
  ];
};

const buildAUHolidays = (year: number): HolidayItem[] => {
  const countryCode = 'AU';
  const kingsBirthday = nthWeekdayOfMonth(year, 5, 1, 2);

  return [
    fixedHoliday(countryCode, 'new_year', "New Year's Day", year, 0, 1),
    fixedHoliday(countryCode, 'australia_day', 'Australia Day', year, 0, 26),
    fixedHoliday(countryCode, 'anzac_day', 'ANZAC Day', year, 3, 25),
    { id: formatHolidayId(countryCode, 'kings_birthday', kingsBirthday), name: "King's Birthday", date: kingsBirthday, countryCode },
    fixedHoliday(countryCode, 'christmas', 'Christmas Day', year, 11, 25),
  ];
};

const COUNTRY_HOLIDAY_BUILDERS: Record<SupportedCountryCode, (year: number) => HolidayItem[]> = {
  US: buildUSHolidays,
  IN: buildINHolidays,
  GB: buildGBHolidays,
  CA: buildCAHolidays,
  AU: buildAUHolidays,
};

export const supportsLocalHolidays = (countryCode?: string): boolean => {
  return Boolean(countryCode && COUNTRY_HOLIDAY_BUILDERS[countryCode as SupportedCountryCode]);
};

export const getCountryHolidays = (countryCode: string | undefined, year: number): HolidayItem[] => {
  if (!countryCode) return [];
  const builder = COUNTRY_HOLIDAY_BUILDERS[countryCode as SupportedCountryCode];
  if (!builder) return [];
  return builder(year);
};

export const getCountryHolidaysInRange = (
  countryCode: string | undefined,
  startDate: Date,
  endDate: Date
): HolidayItem[] => {
  if (!countryCode) return [];

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const allHolidays: HolidayItem[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    allHolidays.push(...getCountryHolidays(countryCode, year));
  }

  return allHolidays.filter(holiday => holiday.date >= startDate && holiday.date <= endDate);
};
