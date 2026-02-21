export const EXCLUDED_EFFECT_MODIFIERS = {
  common: [
    { type: "bonus", subType: "saving-throws" },
    { type: "bonus", subType: "ability-checks" },
    { type: "bonus", subType: "skill-checks" },
    { type: "bonus", subType: "proficiency-bonus" },

    { type: "advantage", subType: "saving-throws" },
    { type: "advantage", subType: "ability-checks" },
    { type: "disadvantage", subType: "saving-throws" },
    { type: "disadvantage", subType: "ability-checks" },

    { type: "set", subType: "strength-score" },
    { type: "set", subType: "dexterity-score" },
    { type: "set", subType: "constitution-score" },
    { type: "set", subType: "wisdom-score" },
    { type: "set", subType: "intelligence-score" },
    { type: "set", subType: "charisma-score" },

    // skills
    { type: "bonus", subType: "acrobatics" },
    { type: "bonus", subType: "animal-handling" },
    { type: "bonus", subType: "arcana" },
    { type: "bonus", subType: "athletics" },
    { type: "bonus", subType: "deception" },
    { type: "bonus", subType: "history" },
    { type: "bonus", subType: "insight" },
    { type: "bonus", subType: "intimidation" },
    { type: "bonus", subType: "investigation" },
    { type: "bonus", subType: "medicine" },
    { type: "bonus", subType: "nature" },
    { type: "bonus", subType: "perception" },
    { type: "bonus", subType: "performance" },
    { type: "bonus", subType: "persuasion" },
    { type: "bonus", subType: "religion" },
    { type: "bonus", subType: "sleight-of-hand" },
    { type: "bonus", subType: "stealth" },
    { type: "bonus", subType: "survival" },

    { type: "advantage", subType: "acrobatics" },
    { type: "advantage", subType: "animal-handling" },
    { type: "advantage", subType: "arcana" },
    { type: "advantage", subType: "athletics" },
    { type: "advantage", subType: "deception" },
    { type: "advantage", subType: "history" },
    { type: "advantage", subType: "insight" },
    { type: "advantage", subType: "intimidation" },
    { type: "advantage", subType: "investigation" },
    { type: "advantage", subType: "medicine" },
    { type: "advantage", subType: "nature" },
    { type: "advantage", subType: "perception" },
    { type: "advantage", subType: "performance" },
    { type: "advantage", subType: "persuasion" },
    { type: "advantage", subType: "religion" },
    { type: "advantage", subType: "sleight-of-hand" },
    { type: "advantage", subType: "stealth" },
    { type: "advantage", subType: "survival" },


    { type: "bonus", subType: "passive-insight" },
    { type: "bonus", subType: "passive-investigation" },
    { type: "bonus", subType: "passive-perception" },
    // advantage on skills - not added here as not used elsewhere in importer.
    // { type: "advantage", subType: "acrobatics" },

    // initiative
    { type: "advantage", subType: "initiative" },
    { type: "bonus", subType: "initiative" },

    { type: "bonus", subType: "strength-ability-checks" },
    { type: "bonus", subType: "dexterity-ability-checks" },
    { type: "bonus", subType: "constitution-ability-checks" },
    { type: "bonus", subType: "wisdom-ability-checks" },
    { type: "bonus", subType: "intelligence-ability-checks" },
    { type: "bonus", subType: "charisma-ability-checks" },

    { type: "bonus", subType: "strength-saving-throws" },
    { type: "bonus", subType: "dexterity-saving-throws" },
    { type: "bonus", subType: "constitution-saving-throws" },
    { type: "bonus", subType: "wisdom-saving-throws" },
    { type: "bonus", subType: "intelligence-saving-throws" },
    { type: "bonus", subType: "charisma-saving-throws" },

    { type: "advantage", subType: "strength-ability-checks" },
    { type: "advantage", subType: "dexterity-ability-checks" },
    { type: "advantage", subType: "constitution-ability-checks" },
    { type: "advantage", subType: "wisdom-ability-checks" },
    { type: "advantage", subType: "intelligence-ability-checks" },
    { type: "advantage", subType: "charisma-ability-checks" },

    { type: "advantage", subType: "strength-saving-throws" },
    { type: "advantage", subType: "dexterity-saving-throws" },
    { type: "advantage", subType: "constitution-saving-throws" },
    { type: "advantage", subType: "wisdom-saving-throws" },
    { type: "advantage", subType: "intelligence-saving-throws" },
    { type: "advantage", subType: "charisma-saving-throws" },

    { type: "disadvantage", subType: "strength-ability-checks" },
    { type: "disadvantage", subType: "dexterity-ability-checks" },
    { type: "disadvantage", subType: "constitution-ability-checks" },
    { type: "disadvantage", subType: "wisdom-ability-checks" },
    { type: "disadvantage", subType: "intelligence-ability-checks" },
    { type: "disadvantage", subType: "charisma-ability-checks" },

    { type: "disadvantage", subType: "strength-saving-throws" },
    { type: "disadvantage", subType: "dexterity-saving-throws" },
    { type: "disadvantage", subType: "constitution-saving-throws" },
    { type: "disadvantage", subType: "wisdom-saving-throws" },
    { type: "disadvantage", subType: "intelligence-saving-throws" },
    { type: "disadvantage", subType: "charisma-saving-throws" },

    // attack modifiers
    { type: "bonus", subType: "weapon-attacks" },
    { type: "bonus", subType: "melee-attacks" },
    { type: "bonus", subType: "ranged-attacks" },
    { type: "bonus", subType: "melee-weapon-attacks" },
    { type: "bonus", subType: "ranged-weapon-attacks" },
    { type: "damage", subType: null },

    // spell modifiers
    { type: "bonus", subType: "spell-save-dc" },
    { type: "bonus", subType: "spell-attacks" },
    { type: "bonus", subType: "melee-spell-attacks" },
    { type: "bonus", subType: "ranged-spell-attacks" },
    { type: "bonus", subType: "warlock-spell-save-dc" },
    { type: "bonus", subType: "warlock-spell-attacks" },
    { type: "bonus", subType: "druid-spell-save-dc" },
    { type: "bonus", subType: "druid-spell-attacks" },
    { type: "bonus", subType: "spell-group-healing" }, // system.bonuses.heal.damage

    // hp modifiers
    { type: "bonus", subType: "hit-points-per-level" },
    { type: "bonus", subType: "hit-points" },

    // attunement
    { type: "set", subType: "attunement-slots" },

    // resistances - subType - e.g. poison - lookup from DICTIONARY
    { type: "resistance", subType: null },
    { type: "immunity", subType: null },
    { type: "vulnerability", subType: null },

  ],
  senses: [
    // senses
    { type: "set-base", subType: "darkvision" },
    { type: "sense", subType: "darkvision" },
    { type: "set-base", subType: "blindsight" },
    { type: "sense", subType: "blindsight" },
    { type: "set-base", subType: "tremorsense" },
    { type: "sense", subType: "tremorsense" },
    { type: "set-base", subType: "truesight" },
    { type: "sense", subType: "truesight" },
  ],
  speedSet: [
    // speeds
    { type: "set", subType: "innate-speed-walking" },
    { type: "set", subType: "innate-speed-climbing" },
    { type: "set", subType: "innate-speed-swimming" },
    { type: "set", subType: "innate-speed-flying" },
  ],
  speedBonus: [
    { type: "bonus", subType: "speed" },
    { type: "bonus", subType: "speed-walking" },
    { type: "bonus", subType: "speed-climbing" },
    { type: "bonus", subType: "speed-swimming" },
    { type: "bonus", subType: "speed-flying" },
  ],
  speedMonk: [
    { type: "bonus", subType: "unarmored-movement" },
  ],
  abilityBonus: [
    { type: "bonus", subType: "strength-score" },
    { type: "bonus", subType: "dexterity-score" },
    { type: "bonus", subType: "constitution-score" },
    { type: "bonus", subType: "wisdom-score" },
    { type: "bonus", subType: "intelligence-score" },
    { type: "bonus", subType: "charisma-score" },
    { type: "stacking-bonus", subType: "strength-score" },
    { type: "stacking-bonus", subType: "dexterity-score" },
    { type: "stacking-bonus", subType: "constitution-score" },
    { type: "stacking-bonus", subType: "wisdom-score" },
    { type: "stacking-bonus", subType: "intelligence-score" },
    { type: "stacking-bonus", subType: "charisma-score" },
    { type: "bonus", subType: "ability-score-maximum" },
  ],
  proficiencyBonus: [
    // profs
    { type: "proficiency", subType: null },
  ],
  languages: [
    // languages - e.g. dwarvish -- lookup from DICTIONARY
    { type: "language", subType: null },
  ],
  acBonus: [
    { type: "bonus", subType: "unarmored-armor-class" },
    { type: "bonus", subType: "armor-class" },
    { type: "bonus", subType: "armored-armor-class" },
    { type: "bonus", subType: "dual-wield-armor-class" },
  ],
  ac: [
    { type: "set", subType: "unarmored-armor-class" },
    { type: "ignore", subType: "unarmored-dex-ac-bonus" },
    { type: "set", subType: "ac-max-dex-modifier" },
  ],
};
