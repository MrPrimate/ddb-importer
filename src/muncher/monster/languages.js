const LANGUAGES = [
  { name: "Common", value: "common" },
  { name: "Aarakocra", value: "aarakocra" },
  { name: "Abyssal", value: "abyssal" },
  { name: "Aquan", value: "aquan" },
  { name: "Auran", value: "auran" },
  { name: "Celestial", value: "celestial" },
  { name: "Deep Speech", value: "deep" },
  { name: "Draconic", value: "draconic" },
  { name: "Druidic", value: "druidic" },
  { name: "Dwarvish", value: "dwarvish" },
  { name: "Elvish", value: "elvish" },
  { name: "Giant", value: "giant" },
  { name: "Gith", value: "gith" },
  { name: "Gnomish", value: "gnomish" },
  { name: "Goblin", value: "goblin" },
  { name: "Gnoll", value: "gnoll" },
  { name: "Halfling", value: "halfling" },
  { name: "Ignan", value: "ignan" },
  { name: "Infernal", value: "infernal" },
  { name: "Orc", value: "orc" },
  { name: "Primordial", value: "primordial" },
  { name: "Terran", value: "terran" },
  { name: "Sylvan", value: "sylvan" },
  { name: "Thieves' Cant", value: "cant" },
  { name: "Thieves’ Cant", value: "cant" },
  { name: "Undercommon", value: "undercommon" },
];


//      "languages": {
//   "value": [
//     "common",
//     "draconic"
//   ],
//   "custom": ""
// },
export function getLanguages (monster, DDB_CONFIG) {
  const config = DDB_CONFIG.languages;

  let values = [];
  let custom = [];

  monster.languages.forEach((lng) => {
    const language = config.find((cfg) => lng.languageId == cfg.id);
    const foundryLanguage = LANGUAGES.find((lang) => lang.name == language.name);
    if (foundryLanguage && lng.notes == '') {
      values.push(foundryLanguage.value);
    } else {
      const notes = (lng.notes !== '') ? ` ${lng.notes}` : "";
      custom.push(language.name + notes);
    }
  });

  custom.push(monster.languageNote);

  const languages = {
    value: values,
    custom: custom.join("; "),
  };

  return languages;
}
