import ISO6391 from "iso-639-1";

// Custom codes for languages that don't have an ISO 639-1 code.
const customCodes: { [key: string]: string } = {
  Persian: "fa",
  "Chinese Simplified": "zh-Hans", // Hans is the ISO 15924 code for Simplified Chinese
  "Chinese Traditional": "zh-Hant", // Hant is the ISO 15924 code for Traditional Chinese
  "Brazilian Portuguese": "pt-BR", // ISO 639-1 doesn't have a code for Brazilian Portuguese
  // ... and so on, feel free to PR more if issues occur.
};

// Custom names that might be more familiar to users.
const customNames: { [key: string]: string } = {
  "Chinese BG code": "Chinese Simplified", // GBK is a character encoding
  "Big 5 code": "Chinese Traditional", // Big 5 is a character encoding used mostly in Taiwan, Hong Kong and Macau
  "Brazillian Portuguese": "Brazilian Portuguese",
  "Farsi/Persian": "Persian",
};

export function getCode(lang: string): string {
  return customCodes[lang] ?? ISO6391.getCode(lang);
}

export function getName(name: string): string {
  if (customNames[name]) return customNames[name];
  if (ISO6391.validate(name)) return ISO6391.getName(name);
  for (const [key, value] of Object.entries(customCodes)) {
    if (value === name) return key;
  }
  return name;
}

export function getLangFromTitle(title: string): {
  code: string;
  name: string;
} | null {
  let split = title.split(".");
  split = split.slice(0, split.length - 1);
  let lang: string | undefined;

  if (split.includes("C")) {
    lang = split[split.indexOf("C") - 1];
    if (lang.length === 2) {
      lang = split[split.indexOf("C") - 2];
    }
  } else {
    split = split.filter((el) => el.length === 2 || el.length === 3);
    split.forEach((el) => {
      el = el.slice(0, 2);
      if (ISO6391.validate(el.slice(0, 2))) {
        lang = getName(el);
      }
    });
  }

  if (!lang) return null;
  if (lang.includes("(")) {
    lang = lang.replaceAll("(", "").replaceAll(")", "");
  }

  const code = getCode(lang);
  return { code, name: getName(code) };
}
