import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import DDBCharacter from "../DDBCharacter.js";


// convert spellcasting ability id to string used by foundry
function convertSpellCastingAbilityId(spellCastingAbilityId) {
  return DICTIONARY.character.abilities.find((ability) => ability.id === spellCastingAbilityId)?.value;
};

function getSpellCastingAbility(klass) {
  const subClassAbilityId = foundry.utils.getProperty(klass, "subclassDefinition.spellCastingAbilityId");
  const subClassAbility = subClassAbilityId ? convertSpellCastingAbilityId(subClassAbilityId) : undefined;
  if (subClassAbility) return subClassAbility;

  const classAbilityId = foundry.utils.getProperty(klass, "definition.spellCastingAbilityId");
  const classAbility = classAbilityId ? convertSpellCastingAbilityId(classAbilityId) : undefined;

  if (classAbility) return classAbility;

  return undefined;
}

DDBCharacter.prototype._generateSpellCasting = function _generateSpellCasting() {
  let result = [];
  this.source.ddb.character.classSpells.forEach((playerClass) => {
    let classInfo = this.source.ddb.character.classes.find((cls) => cls.id === playerClass.characterClassId);
    const spellCastingAbility = getSpellCastingAbility(classInfo);
    if (spellCastingAbility !== undefined) {
      const characterAbilities = this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities;
      let abilityModifier = utils.calculateModifier(characterAbilities[spellCastingAbility].value);
      result.push({ label: spellCastingAbility, value: abilityModifier });
    }
  });
  // we need to decide on one spellcasting ability, so we take the one with the highest modifier
  if (result.length === 0) {
    this.raw.character.system.attributes.spellcasting = "";
  } else {
    this.raw.character.system.attributes.spellcasting = result
      .sort((a, b) => {
        if (a.value > b.value) return -1;
        if (a.value < b.value) return 1;
        return 0;
      })
      .map((entry) => entry.label)[0];
  }
};

DDBCharacter.prototype._generateSpellDC = function _generateSpellDC() {
  if (this.raw.character.system.attributes.spellcasting === "") {
    this.raw.character.system.attributes.spelldc = 10;
  } else {
    const characterAbilities = this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities;
    const dc = 8 + characterAbilities[this.raw.character.system.attributes.spellcasting].mod + this.raw.character.system.attributes.prof;
    this.raw.character.system.attributes.spelldc = dc;
  }
};

DDBCharacter.prototype.getCasterInfo = function getCasterInfo() {
  return this.source.ddb.character.classes
    .filter((cls) => {
      return cls.definition.canCastSpells || (cls.subclassDefinition && cls.subclassDefinition.canCastSpells);
    })
    .map((cls) => {
      // the class total level
      let casterLevel = cls.level;
      // class name
      const name = cls.definition.name;

      // get the casting level if the character is a multiclassed spellcaster
      if (cls.definition.spellRules && cls.definition.spellRules.multiClassSpellSlotDivisor) {
        casterLevel = Math.floor(casterLevel / cls.definition.spellRules.multiClassSpellSlotDivisor);
      } else {
        casterLevel = 0;
      }
      // Blood hunters are weird
      if (["Blood Hunter"].includes(name)) {
        casterLevel = cls.level;
      }

      const cantrips
        = cls.definition.spellRules
        && cls.definition.spellRules.levelCantripsKnownMaxes
        && Array.isArray(cls.definition.spellRules.levelCantripsKnownMaxes)
          ? cls.definition.spellRules.levelCantripsKnownMaxes[casterLevel + 1]
          : 0;

      if (["Warlock", "Blood Hunter"].includes(name)) {
        // pact casting doesn't count towards multiclass spells casting
        // we still add an entry to get cantrip info
        const levelSpellSlots = cls.definition.spellRules.levelSpellSlots[casterLevel];
        const maxLevel = levelSpellSlots.indexOf(Math.max(...levelSpellSlots)) + 1;
        const maxSlots = Math.max(...levelSpellSlots);
        const currentSlots = this.source.ddb.character.pactMagic.find((pact) => pact.level === maxLevel).used;
        if (["Blood Hunter"].includes(name)) {
          this.spellSlots.pact = { value: maxSlots - currentSlots, max: maxSlots, override: maxSlots };
        } else {
          this.spellSlots.pact = { value: maxSlots - currentSlots, max: maxSlots };
        }
        return {
          name,
          casterLevel: 0,
          slots: cls.definition.spellRules.levelSpellSlots[0],
          cantrips,
        };
      } else {
        return {
          name,
          casterLevel,
          slots: cls.definition.spellRules.levelSpellSlots[cls.level],
          cantrips,
        };
      }
    });
};

DDBCharacter.prototype._generateSpellSlots = function _generateSpellSlots() {
  // get the caster information from all classes and subclasses
  const casterInfo = this.getCasterInfo();

  let result = null;
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
    const casterLevelTotal = casterInfo.reduce((prev, cur) => prev + cur.casterLevel, 0);
    const cantripsTotal = casterInfo.reduce((prev, cur) => prev + cur.cantrips, 0);
    result = [cantripsTotal, ...multiClassSpellSlots[casterLevelTotal]];
  } else {
    result = [casterInfo[0].cantrips, ...casterInfo[0].slots];
  }

  for (let i = 1; i < result.length; i++) {
    const currentSlots = this.source.ddb.character.spellSlots.filter((slot) => slot.level === i).map((slot) => slot.used) || 0;
    this.spellSlots["spell" + i] = {
      value: (result[i] - currentSlots) ?? 0,
      max: result[i] ?? 0,
    };
  }
  this.raw.character.system.spells = this.spellSlots;
};

DDBCharacter.prototype._generateMaxPreparedSpells = function _generateMaxPreparedSpells() {
  let max = 0;

  this.source.ddb.character.classes
    .filter((klass) => {
      return (klass.definition.canCastSpells || (klass.subclassDefinition?.canCastSpells));
    })
    .forEach((klass) => {
      const spellCastingAbility = getSpellCastingAbility(klass);
      if (spellCastingAbility !== undefined) {
        const characterAbilities = this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities;
        const abilityModifier = utils.calculateModifier(characterAbilities[spellCastingAbility].value);
        if (klass.definition.spellPrepareType === 1 || klass.subclassDefinition?.spellPrepareType === 1) {
          max += abilityModifier + klass.level;
        } else if (klass.definition.spellPrepareType === 2 || klass.subclassDefinition?.spellPrepareType === 2) {
          max += abilityModifier + Math.floor(klass.level / 2);
        }

      }
    });

  this.raw.character.system.details.maxPreparedSpells = max;
  foundry.utils.setProperty(this.raw.character, "flags.tidy5e-sheet.maxPreparedSpells", max);
  foundry.utils.setProperty(this.raw.character, "flags.tidy5e-sheet-kgar.maxPreparedSpells", max);
};
