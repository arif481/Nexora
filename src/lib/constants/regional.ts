export interface CountryPreference {
  code: string;
  name: string;
  timezone: string;
  currency: string;
  locale: string;
  holidaySupport: boolean;
}

export const COUNTRY_OPTIONS: CountryPreference[] = [
  {
    code: 'US',
    name: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    locale: 'en-US',
    holidaySupport: true,
  },
  {
    code: 'IN',
    name: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    locale: 'en-IN',
    holidaySupport: true,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    timezone: 'Europe/London',
    currency: 'GBP',
    locale: 'en-GB',
    holidaySupport: true,
  },
  {
    code: 'CA',
    name: 'Canada',
    timezone: 'America/Toronto',
    currency: 'CAD',
    locale: 'en-CA',
    holidaySupport: true,
  },
  {
    code: 'AU',
    name: 'Australia',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    locale: 'en-AU',
    holidaySupport: true,
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
    locale: 'en-BD',
    holidaySupport: false,
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    timezone: 'Asia/Dubai',
    currency: 'AED',
    locale: 'en-AE',
    holidaySupport: false,
  },
  {
    code: 'SG',
    name: 'Singapore',
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    locale: 'en-SG',
    holidaySupport: false,
  },
];

export const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

export const COMMON_CURRENCIES = [
  'USD',
  'INR',
  'GBP',
  'CAD',
  'AUD',
  'EUR',
  'BDT',
  'AED',
  'SGD',
  'JPY',
];

export const DEFAULT_COUNTRY_CODE = 'US';
export const DEFAULT_CURRENCY_CODE = 'USD';

export const getCountryPreference = (countryCode?: string): CountryPreference => {
  const normalizedCode = (countryCode || '').toUpperCase();
  return (
    COUNTRY_OPTIONS.find(option => option.code === normalizedCode) ||
    COUNTRY_OPTIONS.find(option => option.code === DEFAULT_COUNTRY_CODE)!
  );
};
