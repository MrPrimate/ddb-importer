import { DICTIONARY } from "../../config/_module.mjs";
import DDBCharacter from "../DDBCharacter.js";
import { DDBModifiers } from "../lib/_module.mjs";

DDBCharacter.prototype.getSenses = function getSenses({ includeEffects = false } = {}) {
  let senses = {
    darkvision: 0,
    blindsight: 0,
    tremorsense: 0,
    truesight: 0,
    units: "ft",
    special: "",
  };
  let special = [];

  // custom senses
  if (this.source.ddb.character.customSenses) {
    this.source.ddb.character.customSenses
      .filter((sense) => sense.distance)
      .forEach((sense) => {
        const s = DICTIONARY.actor.senses.find((s) => s.id === sense.senseId);
        if (s && sense.distance && Number.isInteger(sense.distance)) {
          senses[s.name.toLowerCase()] = parseInt(sense.distance);
        } else {
          senses.special += `${sense.distance}; `;
        }
      });
  }

  // Base senses
  for (const senseName in senses) {
    const basicOptions = { subType: senseName, includeExcludedEffects: includeEffects };
    DDBModifiers
      .filterBaseModifiers(this.source.ddb, "set-base", basicOptions)
      .filter((mod) =>
        !this.source.ddb.character.choices.choiceDefinitions.some((def) =>
          def.options.some((opt) => opt.id === mod.componentId),
        ),
      )
      .forEach((sense) => {
        if (Number.isInteger(sense.value) && sense.value > senses[senseName]) {
          senses[senseName] = parseInt(sense.value);
        }
      });
  }

  // Devils Sight gives bright light to 120 foot instead of normal darkvision
  const devilsSightFilters = {
    subType: "darkvision",
    restriction: [
      "You can see normally in darkness, both magical and nonmagical",
    ],
    includeExcludedEffects: includeEffects,
  };
  DDBModifiers
    .filterBaseModifiers(this.source.ddb, "set-base", devilsSightFilters)
    .forEach((sense) => {
      if (Number.isInteger(sense.value) && sense.value > senses['darkvision']) {
        senses['darkvision'] = parseInt(sense.value);
        special.push("You can see normally in darkness, both magical and nonmagical.");
      }
    });

  // Magical bonuses and additional, e.g. Gloom Stalker
  const magicalBonusFilters = {
    // subType: "darkvision",
    restriction: ["", null, "plus 60 feet if wearer already has Darkvision"],
    includeExcludedEffects: includeEffects,
  };
  DDBModifiers
    .filterBaseModifiers(this.source.ddb, "sense", magicalBonusFilters)
    .filter((mod) =>
      !this.source.ddb.character.choices.choiceDefinitions.some((def) =>
        def.options.some((opt) => opt.id === mod.componentId),
      ),
    )
    .forEach((mod) => {
      const hasSense = mod.subType in senses;
      if (hasSense && mod.value && Number.isInteger(mod.value)) {
        senses[mod.subType] += parseInt(mod.value);
      } else if (mod.value) {
        special.push(`${mod.friendlySubtypeName} (${mod.value})`);
      } else if (mod.friendlySubtypeName) {
        special.push(`${mod.friendlySubtypeName}`);
      }
    });

  senses.special = special.join(", ");
  return senses;

};

DDBCharacter.prototype._generateSenses = function _generateSenses() {
  this.raw.character.system.attributes.senses = this.getSenses();
};
