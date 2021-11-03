import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

// is there a spell casting ability?
let hasSpellCastingAbility = (spellCastingAbilityId) => {
  return DICTIONARY.character.abilities.find((ability) => ability.id === spellCastingAbilityId) !== undefined;
};

// convert spellcasting ability id to string used by foundry
let convertSpellCastingAbilityId = (spellCastingAbilityId) => {
  return DICTIONARY.character.abilities.find((ability) => ability.id === spellCastingAbilityId).value;
};

function getSpellCastingAbility(klass) {
  let spellCastingAbility = undefined;
  if (hasSpellCastingAbility(klass.definition.spellCastingAbilityId)) {
    // check to see if class has a spell casting ability
    spellCastingAbility = convertSpellCastingAbilityId(klass.definition.spellCastingAbilityId);
  } else if (
    klass.subclassDefinition &&
    hasSpellCastingAbility(klass.subclassDefinition.spellCastingAbilityId)
  ) {
    // some subclasses attach a spellcasting ability, e.g. Arcane Trickster
    spellCastingAbility = convertSpellCastingAbilityId(klass.subclassDefinition.spellCastingAbilityId);
  }
  return spellCastingAbility;
}

export function getSpellCasting(data, character) {
  let result = [];
  data.character.classSpells.forEach((playerClass) => {
    let classInfo = data.character.classes.find((cls) => cls.id === playerClass.characterClassId);
    const spellCastingAbility = getSpellCastingAbility(classInfo);
    if (spellCastingAbility !== undefined) {
      const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
      let abilityModifier = utils.calculateModifier(characterAbilities[spellCastingAbility].value);
      result.push({ label: spellCastingAbility, value: abilityModifier });
    }
  });
  // we need to decide on one spellcasting ability, so we take the one with the highest modifier
  if (result.length === 0) {
    return "";
  } else {
    return result
      .sort((a, b) => {
        if (a.value > b.value) return -1;
        if (a.value < b.value) return 1;
        return 0;
      })
      .map((entry) => entry.label)[0];
  }
}

export function getSpellDC(data, character) {
  if (character.data.attributes.spellcasting === "") {
    return 10;
  } else {
    const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
    return 8 + characterAbilities[character.data.attributes.spellcasting].mod + character.data.attributes.prof;
  }
}

export function getSpellSlots(data) {
  let spellSlots = {};
  // get the caster information from all classes and subclasses
  let getCasterInfo = () => {
    return data.character.classes
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

        const cantrips =
          cls.definition.spellRules &&
          cls.definition.spellRules.levelCantripsKnownMaxes &&
          Array.isArray(cls.definition.spellRules.levelCantripsKnownMaxes)
            ? cls.definition.spellRules.levelCantripsKnownMaxes[casterLevel + 1]
            : 0;

        if (["Warlock", "Blood Hunter"].includes(name)) {
          // pact casting doesn't count towards multiclass spells casting
          // we still add an entry to get cantrip info
          const levelSpellSlots = cls.definition.spellRules.levelSpellSlots[casterLevel];
          const maxLevel = levelSpellSlots.indexOf(Math.max(...levelSpellSlots)) + 1;
          const maxSlots = Math.max(...levelSpellSlots);
          const currentSlots = data.character.pactMagic.find((pact) => pact.level === maxLevel).used;
          if (["Blood Hunter"].includes(name)) {
            spellSlots.pact = { value: maxSlots - currentSlots, max: maxSlots, override: maxSlots };
          } else {
            spellSlots.pact = { value: maxSlots - currentSlots, max: maxSlots };
          }
          return {
            name: name,
            casterLevel: 0,
            slots: cls.definition.spellRules.levelSpellSlots[0],
            cantrips: cantrips,
          };
        } else {
          return {
            name: name,
            casterLevel: casterLevel,
            slots: cls.definition.spellRules.levelSpellSlots[cls.level],
            cantrips: cantrips,
          };
        }
      });
  };

  let casterInfo = getCasterInfo(data);

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

  for (let i = 0; i < result.length; i++) {
    const currentSlots = data.character.spellSlots.filter((slot) => slot.level === i).map((slot) => slot.used) || 0;
    spellSlots["spell" + i] = {
      value: result[i] - currentSlots,
      max: result[i],
    };
  }
  return spellSlots;
}

export function maxPreparedSpells(data, character) {
  let max = 0;

  data.character.classes
    .filter((klass) => {
      return (klass.definition.canCastSpells || (klass.subclassDefinition && klass.subclassDefinition.canCastSpells)) &&
        (klass.definition.spellPrepareType === 1 || (klass.subclassDefinition && klass.subclassDefinition.spellPrepareType === 1));
    })
    .forEach((klass) => {
      const spellCastingAbility = getSpellCastingAbility(klass);
      if (spellCastingAbility !== undefined) {
        const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
        const abilityModifier = utils.calculateModifier(characterAbilities[spellCastingAbility].value);
        max += abilityModifier + klass.level;
      }
    });

  return max;
}
