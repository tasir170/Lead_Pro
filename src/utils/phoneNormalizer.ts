export interface PhoneNormalizationResult {
  raw: string;
  isValid: boolean;
  e164Digits: string; // Digits only without leading +, suitable for wa.me/DIGITS
  formattedDisplay: string; // e.g. +1 4158904421
  country: string;
  detectedDialCode?: string;
  validationError?: string;
}

const COUNTRY_DIAL_CODES: Record<string, { code: string; name: string }> = {
  'united states': { code: '1', name: 'United States' },
  'usa': { code: '1', name: 'United States' },
  'us': { code: '1', name: 'United States' },
  'canada': { code: '1', name: 'Canada' },
  'united arab emirates': { code: '971', name: 'United Arab Emirates' },
  'uae': { code: '971', name: 'United Arab Emirates' },
  'dubai': { code: '971', name: 'United Arab Emirates' },
  'abu dhabi': { code: '971', name: 'United Arab Emirates' },
  'sweden': { code: '46', name: 'Sweden' },
  'united kingdom': { code: '44', name: 'United Kingdom' },
  'uk': { code: '44', name: 'United Kingdom' },
  'great britain': { code: '44', name: 'United Kingdom' },
  'germany': { code: '49', name: 'Germany' },
  'france': { code: '33', name: 'France' },
  'singapore': { code: '65', name: 'Singapore' },
  'australia': { code: '61', name: 'Australia' },
  'india': { code: '91', name: 'India' },
  'saudi arabia': { code: '966', name: 'Saudi Arabia' },
  'ksa': { code: '966', name: 'Saudi Arabia' },
  'netherlands': { code: '31', name: 'Netherlands' },
  'spain': { code: '34', name: 'Spain' },
  'italy': { code: '39', name: 'Italy' },
  'brazil': { code: '55', name: 'Brazil' },
  'switzerland': { code: '41', name: 'Switzerland' },
  'pakistan': { code: '92', name: 'Pakistan' },
  'pk': { code: '92', name: 'Pakistan' },
};

/**
 * Normalizes phone numbers into international format suitable for WhatsApp (wa.me/PHONE_NUMBER).
 * Enforces rule: "Do not assume a country code when the country is unknown."
 */
export function normalizePhoneNumber(
  rawPhone?: string | null,
  countryHint?: string | null
): PhoneNormalizationResult {
  if (!rawPhone || typeof rawPhone !== 'string' || rawPhone.trim().length === 0) {
    return {
      raw: '',
      isValid: false,
      e164Digits: '',
      formattedDisplay: '',
      country: countryHint || 'Unknown',
      validationError: 'No phone number provided',
    };
  }

  const trimmed = rawPhone.trim();
  const hasLeadingPlus = trimmed.startsWith('+') || trimmed.startsWith('00');
  
  // Strip all non-digit characters
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 6) {
    return {
      raw: trimmed,
      isValid: false,
      e164Digits: '',
      formattedDisplay: trimmed,
      country: countryHint || 'Unknown',
      validationError: 'Phone number is too short (minimum 7 digits required)',
    };
  }

  // Case 1: Phone number explicitly includes international prefix (+)
  if (hasLeadingPlus) {
    const cleanDigits = trimmed.startsWith('00') ? digitsOnly.slice(2) : digitsOnly;
    if (cleanDigits.length >= 8 && cleanDigits.length <= 15) {
      return {
        raw: trimmed,
        isValid: true,
        e164Digits: cleanDigits,
        formattedDisplay: `+${cleanDigits}`,
        country: countryHint || detectCountryFromDigits(cleanDigits),
        detectedDialCode: detectDialCode(cleanDigits),
      };
    }
  }

  // Case 2: Phone number has no plus, check if country is known
  const countryKey = (countryHint || '').trim().toLowerCase();
  const knownCountry = COUNTRY_DIAL_CODES[countryKey];

  if (knownCountry) {
    let cleanLocalDigits = digitsOnly;
    if (cleanLocalDigits.startsWith('0')) {
      cleanLocalDigits = cleanLocalDigits.slice(1);
    }

    let finalDigits = cleanLocalDigits;
    if (!cleanLocalDigits.startsWith(knownCountry.code)) {
      finalDigits = `${knownCountry.code}${cleanLocalDigits}`;
    }

    if (finalDigits.length >= 8 && finalDigits.length <= 15) {
      return {
        raw: trimmed,
        isValid: true,
        e164Digits: finalDigits,
        formattedDisplay: `+${finalDigits}`,
        country: knownCountry.name,
        detectedDialCode: knownCountry.code,
      };
    }
  }

  // Case 3: Country is unknown or unrecognized, AND number has no leading plus
  return {
    raw: trimmed,
    isValid: false,
    e164Digits: '',
    formattedDisplay: trimmed,
    country: countryHint || 'Unknown',
    validationError: 'Country is unknown and number lacks international (+) country code. Specify country or include + dial code.',
  };
}

function detectCountryFromDigits(digits: string): string {
  if (digits.startsWith('971')) return 'United Arab Emirates';
  if (digits.startsWith('1')) return 'United States / Canada';
  if (digits.startsWith('44')) return 'United Kingdom';
  if (digits.startsWith('46')) return 'Sweden';
  if (digits.startsWith('49')) return 'Germany';
  if (digits.startsWith('33')) return 'France';
  if (digits.startsWith('65')) return 'Singapore';
  if (digits.startsWith('91')) return 'India';
  if (digits.startsWith('92')) return 'Pakistan';
  return 'International';
}

function detectDialCode(digits: string): string {
  for (const info of Object.values(COUNTRY_DIAL_CODES)) {
    if (digits.startsWith(info.code)) {
      return info.code;
    }
  }
  return '';
}

/**
 * Builds the official wa.me contact link with encoded text
 * Example: https://wa.me/14158904421?text=Hello%20there
 */
export function buildWaMeUrl(e164Digits: string, messageText: string): string {
  const cleanDigits = e164Digits.replace(/\D/g, '');
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${cleanDigits}?text=${encodedText}`;
}
