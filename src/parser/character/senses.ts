import { DICTIONARY } from "../../config/_module";
import DDBCharacter from "../DDBCharacter";
import { DDBModifiers } from "../lib/_module";


DDBCharacter.prototype.getSenses = function getSenses(this: DDBCharacter, { includeEffects = false } = {}): I5eSenses {
  const senses: I5eSenses = {
    ranges: {
      darkvision: 0,
      blindsight: 0,
      tremorsense: 0,
      truesight: 0,
    },
    units: "ft",
    special: "",
  };
  const special: string[] = [];

  // custom senses
  if (this.source.ddb.character.customSenses) {
    this.source.ddb.character.customSenses
      .filter((sense) => sense.distance)
      .forEach((sense) => {
        const s = DICTIONARY.actor.senses.find((s) => s.id === sense.senseId);
        if (s && sense.distance && Number.isInteger(sense.distance)) {
          const senseType = s.name.toLowerCase() as TSenseType;
          senses.ranges[senseType] = parseInt(String(sense.distance));
        } else {
          senses.special += `${sense.distance}; `;
        }
      });
  }

  // Base senses
  for (const senseName in senses.ranges) {
    const basicOptions = { subType: senseName, includeExcludedEffects: includeEffects };
    DDBModifiers
      .filterBaseModifiers(this.source.ddb, "set-base", basicOptions)
      .filter((mod) =>
        !this.source.ddb.character.choices.choiceDefinitions.some((def) =>
          def.options.some((opt) => opt.id === mod.componentId),
        ),
      )
      .forEach((sense) => {
        const senseKey = senseName as TSenseType;
        if (Number.isInteger(sense.value) && parseInt(String(sense.value)) > senses.ranges[senseKey]) {
          senses.ranges[senseKey] = parseInt(String(sense.value));
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
      if (Number.isInteger(parseInt(String(sense.value)))
        && parseInt(String(sense.value)) > senses.ranges["darkvision"]
      ) {
        senses.ranges["darkvision"] = parseInt(String(sense.value));
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
      const hasSense = mod.subType in senses.ranges;
      if (hasSense && mod.value && Number.isInteger(mod.value)) {
        const senseType = mod.subType as TSenseType;
        senses.ranges[senseType] += parseInt(String(mod.value));
      } else if (mod.value) {
        special.push(`${mod.friendlySubtypeName} (${mod.value})`);
      } else if (mod.friendlySubtypeName) {
        special.push(`${mod.friendlySubtypeName}`);
      }
    });

  senses.special = special.join(", ");
  return senses;

};

DDBCharacter.prototype._generateSenses = function _generateSenses(this: DDBCharacter) {
  this.raw.character.system.attributes.senses = this.getSenses();
};
