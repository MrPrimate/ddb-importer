import DDBMonster from "../DDBMonster";
import { ProficiencyFinder } from "../lib/_module";

//      "languages": {
//   "value": [
//     "common",
//     "draconic"
//   ],
//   "custom": ""
// },

DDBMonster.prototype._generateLanguages = function _generateLanguages () {
  const config = CONFIG.DDB.languages;

  const values = [];
  const custom = [];

  this.source.languages.forEach((lng) => {
    // languageId 100 is sometimes used, but not in config. it is thieves cant
    const languageId = lng.languageId === 100 ? 46 : lng.languageId;
    const language = config.find((cfg) => languageId == cfg.id);
    const foundryLanguage = ProficiencyFinder.getMappedLanguage({ name: language?.name ?? "Unknown Language" });
    if (foundryLanguage && (!lng.notes || lng.notes == "")) {
      values.push(foundryLanguage);
    } else if (language) {
      const notes = (lng.notes !== "") ? ` ${lng.notes}` : "";
      custom.push(language.name + notes);
    }
  });

  if (this.source.languageNote && !this.source.languageNote.includes("--")) {
    custom.push(this.source.languageNote);
  }

  this.npc.system.traits.languages = {
    value: values,
    custom: custom.join("; "),
  };
};
