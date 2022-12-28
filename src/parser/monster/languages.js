import DICTIONARY from "../../dictionary.js";
import DDBMonster from "../DDBMonster.js";

//      "languages": {
//   "value": [
//     "common",
//     "draconic"
//   ],
//   "custom": ""
// },

DDBMonster.prototype._generateLanguages = function _generateLanguages () {
  const config = CONFIG.DDB.languages;

  let values = [];
  let custom = [];

  this.source.languages.forEach((lng) => {
    const language = config.find((cfg) => lng.languageId == cfg.id);
    const foundryLanguage = DICTIONARY.character.languages.find((lang) => lang.name == language.name);
    if (foundryLanguage && lng.notes == '') {
      values.push(foundryLanguage.value);
    } else if (language) {
      const notes = (lng.notes !== '') ? ` ${lng.notes}` : "";
      custom.push(language.name + notes);
    }
  });

  if (this.source.languageNote && !this.source.languageNote.includes("--")) custom.push(this.source.languageNote);

  this.npc.system.traits.languages = {
    value: values,
    custom: custom.join("; "),
  };
};
