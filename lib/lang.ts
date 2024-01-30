import ISO6391 from "iso-639-1";

// Custom codes for languages that don't have an ISO 639-1 code.
const customCodes = {
  Persian: "fa",
  "Chinese Simplified": "zh-Hans", // Hans is the ISO 15924 code for Simplified Chinese
  "Chinese Traditional": "zh-Hant", // Hant is the ISO 15924 code for Traditional Chinese
  "Brazilian Portuguese": "pt-BR", // ISO 639-1 doesn't have a code for Brazilian Portuguese
  // ... and so on, feel free to PR more if issues occur.
};

// Custom names that might be more familiar to users.
const customNames = {
  "Chinese BG code": "Chinese Simplified", // GBK is a character encoding
  "Big 5 code": "Chinese Traditional", // Big 5 is a character encoding used mostly in Taiwan, Hong Kong and Macau
  "Brazillian Portuguese": "Brazilian Portuguese",
  "Farsi/Persian": "Persian",
};

export function getCode(lang: string) {
  return customCodes[lang] ?? ISO6391.getCode(lang);
}

export function getName(name: string) {
  return customNames[name] ?? name;
}
