import { DICTIONARY } from "../../config/_module";
import { logger, utils } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";


// convert spellcasting ability id to string used by foundry
function convertSpellCastingAbilityId(spellCastingAbilityId: number | string) {
  return DICTIONARY.actor.abilities.find((ability) => ability.id === parseInt(String(spellCastingAbilityId)))?.value;
};

function getSpellCastingAbility(klass: IDDBClass): T5eAbility | undefined {
  const subClassAbilityId = foundry.utils.getProperty(klass, "subclassDefinition.spellCastingAbilityId") as number;
  const subClassAbility = subClassAbilityId ? convertSpellCastingAbilityId(subClassAbilityId) : undefined;
  if (subClassAbility) return subClassAbility;

  const classAbilityId = foundry.utils.getProperty(klass, "definition.spellCastingAbilityId") as number;
  const classAbility = classAbilityId ? convertSpellCastingAbilityId(classAbilityId) : undefined;

  if (classAbility) return classAbility;

  return undefined;
}

DDBCharacter.prototype._generateSpellCasting = function _generateSpellCasting(this: DDBCharacter) {
  const attributes = this.raw.character.system.attributes;
  const characterAbilities = this.raw.character.flags?.ddbimporter?.dndbeyond?.effectAbilities;
  if (!this.source || !attributes || !characterAbilities) {
    logger.warn("_generateSpellCasting: missing DDB source data, character attributes, or effect abilities");
    return;
  }
  const ddbCharacter = this.source.ddb.character;
  const result: { label: string; value: number }[] = [];
  ddbCharacter.classSpells.forEach((playerClass) => {
    const classInfo = ddbCharacter.classes.find((cls) => cls.id === playerClass.characterClassId);
    if (!classInfo) {
      logger.warn(`_generateSpellCasting: unable to find class for class spell id ${playerClass.characterClassId}`);
      return;
    }
    const spellCastingAbility = getSpellCastingAbility(classInfo);
    if (spellCastingAbility !== undefined) {
      const abilityScore = characterAbilities[spellCastingAbility].value;
      if (abilityScore === undefined) {
        logger.warn(`_generateSpellCasting: missing ability score for ${spellCastingAbility}`);
        return;
      }
      const abilityModifier = utils.calculateModifier(abilityScore);
      result.push({ label: spellCastingAbility, value: abilityModifier });
    }
  });
  // we need to decide on one spellcasting ability, so we take the one with the highest modifier
  if (result.length === 0) {
    attributes.spellcasting = "";
  } else {
    attributes.spellcasting = result
      .sort((a, b) => {
        if (a.value > b.value) return -1;
        if (a.value < b.value) return 1;
        return 0;
      })
      .map((entry) => entry.label)[0];
  }
};

DDBCharacter.prototype.getCasterInfo = function getCasterInfo(this: DDBCharacter): IDDBCasterInfo[] {
  if (!this.source) {
    logger.warn("getCasterInfo called before DDB source data was loaded");
    return [];
  }
  const ddbCharacter = this.source.ddb.character;
  return ddbCharacter.classes
    .filter((cls) => {
      return cls.definition.canCastSpells || (cls.subclassDefinition && cls.subclassDefinition.canCastSpells);
    })
    .map((cls) => {
      const spellRules = cls.definition.spellRules;
      // the class total level
      let casterLevel = cls.level;
      // class name
      const name = cls.definition.name;

      // get the casting level if the character is a multiclassed spellcaster
      if (spellRules && spellRules.multiClassSpellSlotDivisor) {
        casterLevel = Math.floor(casterLevel / spellRules.multiClassSpellSlotDivisor);
      } else {
        casterLevel = 0;
      }
      // Blood hunters are weird
      if (["Blood Hunter"].includes(name)) {
        casterLevel = cls.level;
      }

      const cantrips
        = spellRules
        && spellRules.levelCantripsKnownMaxes
        && Array.isArray(spellRules.levelCantripsKnownMaxes)
          ? spellRules.levelCantripsKnownMaxes[casterLevel + 1]
          : 0;

      if (["Warlock", "Blood Hunter"].includes(name)) {
        // pact casting doesn't count towards multiclass spells casting
        // we still add an entry to get cantrip info
        const levelSpellSlots = spellRules?.levelSpellSlots[casterLevel];
        if (!spellRules || !levelSpellSlots) {
          logger.warn(`getCasterInfo: missing pact spell slot data for ${name}`, { class: cls });
          return {
            name,
            casterLevel: 0,
            slots: [],
            cantrips,
          };
        }
        const maxLevel = levelSpellSlots.indexOf(Math.max(...levelSpellSlots)) + 1;
        const maxSlots = Math.max(...levelSpellSlots);
        const pactEntry = ddbCharacter.pactMagic.find((pact) => pact.level === maxLevel);
        if (!pactEntry) {
          logger.warn(`No pact magic entry found for level ${maxLevel} on ${name}, assuming no slots used`);
        }
        const currentSlots = pactEntry?.used ?? 0;
        if (["Blood Hunter"].includes(name)) {
          this.spellSlots.pact = { value: maxSlots - currentSlots, max: String(maxSlots), override: maxSlots };
        } else {
          this.spellSlots.pact = { value: maxSlots - currentSlots, max: String(maxSlots) };
        }
        return {
          name,
          casterLevel: 0,
          slots: spellRules.levelSpellSlots[0],
          cantrips,
        };
      } else {
        if (!spellRules) {
          logger.warn(`getCasterInfo: missing spell slot data for ${name}`, { class: cls });
        }
        return {
          name,
          casterLevel,
          slots: spellRules?.levelSpellSlots[cls.level] ?? [],
          cantrips,
        };
      }
    });
};

DDBCharacter.prototype._generateSpellSlots = function _generateSpellSlots(this: DDBCharacter) {
  if (!this.source) {
    logger.warn("_generateSpellSlots called before DDB source data was loaded");
    return;
  }
  const ddbCharacter = this.source.ddb.character;
  // get the caster information from all classes and subclasses
  const casterInfo = this.getCasterInfo();

  let result;
  if (casterInfo.length !== 1) {
    const multiClassSpellSlots = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0], // 0
      [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
      [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
      [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
      [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
      [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
      [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
      [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
      [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
      [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
      [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
      [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
      [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
      [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
      [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
      [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
      [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
      [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
      [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
      [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
      [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
    ];
    const casterLevelTotal = casterInfo.reduce((prev: number, cur) => prev + cur.casterLevel, 0);
    const cantripsTotal = casterInfo.reduce((prev: number, cur) => prev + cur.cantrips, 0);
    result = [cantripsTotal, ...multiClassSpellSlots[casterLevelTotal]];
  } else {
    result = [casterInfo[0].cantrips, ...casterInfo[0].slots];
  }

  for (let i = 1; i < result.length; i++) {
    const currentSlots = ddbCharacter.spellSlots.filter((slot) => slot.level === i).map((slot) => slot.used).reduce((a, b) => a + b, 0) ?? 0;
    this.spellSlots[`spell${i}` as keyof I5eSpellSlots] = {
      value: Number.isInteger(result[i]) ? (result[i] - currentSlots) : 0,
      max: Number.isInteger(result[i]) ? String(result[i]) : String(0),
    };
  }
  this.raw.character.system.spells = this.spellSlots;
};

DDBCharacter.prototype._generateMaxPreparedSpells = function _generateMaxPreparedSpells(this: DDBCharacter) {
  const characterAbilities = this.raw.character.flags?.ddbimporter?.dndbeyond?.effectAbilities;
  if (!this.source || !characterAbilities) {
    logger.warn("_generateMaxPreparedSpells: missing DDB source data or effect abilities");
    return;
  }
  let max = 0;

  this.source.ddb.character.classes
    .filter((klass) => {
      return (klass.definition.canCastSpells || (klass.subclassDefinition?.canCastSpells));
    })
    .forEach((klass) => {
      const spellCastingAbility = getSpellCastingAbility(klass);
      if (spellCastingAbility !== undefined) {
        const abilityScore = characterAbilities[spellCastingAbility].value;
        if (abilityScore === undefined) {
          logger.warn(`_generateMaxPreparedSpells: missing ability score for ${spellCastingAbility}`);
          return;
        }
        const abilityModifier = utils.calculateModifier(abilityScore);
        if (klass.definition.spellPrepareType === 1 || klass.subclassDefinition?.spellPrepareType === 1) {
          max += abilityModifier + klass.level;
        } else if (klass.definition.spellPrepareType === 2 || klass.subclassDefinition?.spellPrepareType === 2) {
          max += abilityModifier + Math.floor(klass.level / 2);
        }

      }
    });

  // this.raw.character.system.details.maxPreparedSpells = max;
  foundry.utils.setProperty(this.raw.character, "flags.tidy5e-sheet.maxPreparedSpells", max);
  foundry.utils.setProperty(this.raw.character, "flags.tidy5e-sheet-kgar.maxPreparedSpells", max);
};
