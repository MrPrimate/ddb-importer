import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { AutoEffects } from "../enrichers/effects/_module";
import { DDBModifiers } from "../lib/_module";

DDBCharacter.prototype.getSkillProficiency = function getSkillProficiency (this: DDBCharacter, skill: IDDBSkillsLookup, modifiers: IModifiersMod[] | null = null): number {
  if (!modifiers) {
    const ddb = this.source?.ddb;
    if (!ddb) {
      logger.warn("getSkillProficiency: no DDB source data available, returning no proficiency");
      return 0;
    }
    modifiers = DDBModifiers.getAllModifiers(ddb, { includeExcludedEffects: true });
  }

  const skillMatches = modifiers
    .filter((modifier) => modifier.friendlySubtypeName === skill.label)
    .map((mod) => mod.type);

  const halfProficiency = modifiers.find(
    (modifier) =>
    // Jack of All trades/half-rounded down
      (modifier.type === "half-proficiency" && modifier.subType === "ability-checks")
        // e.g. champion for specific ability checks
        || this.proficiencyFinder.isHalfProficiencyRoundedUp(skill.ability, modifiers),
  ) !== undefined
    ? 0.5
    : 0;

  const proficient = skillMatches.includes("expertise") ? 2 : skillMatches.includes("proficiency") ? 1 : halfProficiency;

  return proficient;
};

DDBCharacter.prototype.getCustomSkillProficiency = function getCustomSkillProficiency(this: DDBCharacter, skill: IDDBSkillsLookup): number | undefined {
  // Overwrite the proficient value with any custom set over rides
  const characterValues = this.source?.ddb.character.characterValues;
  if (characterValues) {
    const customProficiency = characterValues.find(
      (value) => value.typeId === 26 && value.valueId == skill.valueId && value.value,
    );
    if (customProficiency) {
      const proficiencyEntry = DICTIONARY.actor.customSkillProficiencies
        .find((prof) => prof.value === customProficiency.value);
      if (!proficiencyEntry) {
        logger.warn(`getCustomSkillProficiency: no proficiency mapping for custom skill value ${customProficiency.value}`, { customProficiency });
        return undefined;
      }
      return proficiencyEntry.proficient;
    }
  }
  return undefined;
  // The declaration-merged DDBCharacter interface types this method as returning
  // number, but undefined is a meaningful "no custom override" result that
  // callers check with !== undefined. Cast retained so this pass does not touch
  // DDBCharacter.ts; the declaration there should gain "| undefined" in a
  // future pass.
} as typeof DDBCharacter.prototype.getCustomSkillProficiency;

DDBCharacter.prototype.getCustomSkillAbility = function getCustomSkillAbility(this: DDBCharacter, skill: IDDBSkillsLookup): T5eAbility | undefined {
  // Overwrite the proficient value with any custom set over rides
  let mod;
  const characterValues = this.source?.ddb.character.characterValues;
  if (characterValues) {
    const customAbility = characterValues.find(
      (value) => value.typeId === 27 && value.valueId == skill.valueId,
    );
    if (customAbility) {
      const ability = DICTIONARY.actor.abilities.find((ability) => ability.id == customAbility.value);
      if (ability)
        mod = ability.value;
    }
  }
  return mod;
};

DDBCharacter.prototype.getCustomSkillBonus = function getCustomSkillBonus(this: DDBCharacter, skill: IDDBSkillsLookup): number {
  // Get any custom skill bonuses
  const characterValues = this.source?.ddb.character.characterValues;
  if (characterValues) {
    const customBonus = characterValues.filter(
      (value) => (value.typeId == 24 || value.typeId == 25) && value.valueId == skill.valueId,
    ).reduce((total, bonus) => {
      const value = parseInt(String(bonus.value));
      return total + value;
    }, 0);

    if (customBonus) {
      return customBonus;
    }
  }
  return 0;
};

DDBCharacter.prototype._setSpecialSkills = function _setSpecialSkills(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  const skills = this.raw.character.system.skills;
  if (!ddb || !skills) {
    logger.warn("_setSpecialSkills: missing DDB source data or character skills, skipping");
    return;
  }
  ddb.character.classes.forEach((klass) => {
    if (klass.subclassDefinition) {
      const silverTongue = klass.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Silver Tongue" && klass.level >= feature.requiredLevel,
      );
      if (silverTongue) {
        const perRoll = skills["per"].roll;
        const decRoll = skills["dec"].roll;
        if (perRoll && decRoll) {
          perRoll.min = 10;
          decRoll.min = 10;
        } else {
          logger.warn("_setSpecialSkills: skill roll data missing, unable to apply Silver Tongue minimum roll");
        }
      }
    }
  });
};

DDBCharacter.prototype._generateCustomSkills = async function _generateCustomSkills(this: DDBCharacter) {
  const customSkillsModule = game.modules?.get("dnd5e-custom-skills");
  if (!customSkillsModule?.active) return;
  const version = customSkillsModule.version;
  const newEnough = version ? foundry.utils.isNewerVersion(version, "1.1.2") : false;
  if (!newEnough) return;

  const ddb = this.source?.ddb;
  const skills = this.raw.character.system.skills;
  if (!ddb || !skills) {
    logger.warn("_generateCustomSkills: missing DDB source data or character skills, skipping");
    return;
  }

  const customSkillData = ddb.character.customProficiencies
    .filter((prof) => prof.type === 1 && Number.isInteger(prof.statId))
    .map((prof) => {
      const ability = DICTIONARY.actor.abilities.find((a) => a.id == prof.statId);
      return {
        ability: ability?.value,
        label: prof.name,
        proficiencyLevel: prof.proficiencyLevel,
        miscBonus: prof.miscBonus,
        magicBonus: prof.magicBonus,
        override: prof.override,
      };
    });

  const skillData = {};

  for (let i = 0; i < customSkillData.length; i++) {
    (skillData as Record<string, any>)[i] = customSkillData[i];
  }

  const customSkills: {
    skills: {
      list: Record<string, { applied?: number | boolean; label?: string; ability?: T5eAbility }>;
    };
  } = await window.dnd5eCustomSkills("add", { skills: skillData });

  for (const [key, value] of Object.entries(customSkills.skills.list)) {
    if (value.applied || value.applied === 1) {
      const customSkillMatch = customSkillData.find((customSkill) => customSkill.label === value.label);
      if (customSkillMatch) {
        logger.debug(`Adding custom skill ${value.label}`, { key, value, customSkillMatch });
        const proficiencyEntry = DICTIONARY.actor.customSkillProficiencies.find((proficiency) =>
          proficiency.value === customSkillMatch.proficiencyLevel,
        );
        if (!proficiencyEntry) {
          logger.warn(`_generateCustomSkills: no proficiency mapping for custom skill level ${customSkillMatch.proficiencyLevel}`, { customSkillMatch });
          continue;
        }
        const prof = proficiencyEntry.proficient;
        const miscBonus = customSkillMatch.miscBonus && customSkillMatch.miscBonus !== 0
          ? `+ ${customSkillMatch.miscBonus}`
          : "";
        const magicBonus = customSkillMatch.magicBonus && customSkillMatch.magicBonus !== 0
          ? ` + ${customSkillMatch.magicBonus}`
          : "";
        if (customSkillMatch) {
          const checkBonus = (miscBonus + magicBonus).trim();
          skills[key as T5eSkillKey] = {
            ability: value.ability,
            value: prof,
            bonuses: {
              "check": `${parseInt(checkBonus) === 0 ? "" : checkBonus}`,
              "passive": "",
            },
            roll: {
              min: null,
              max: null,
              mode: 0,
            },
          };
        }
      }
    }
  }
};

DDBCharacter.prototype._generateSkills = async function _generateSkills(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  const skills = this.raw.character.system.skills;
  if (!ddb || !skills) {
    logger.warn("_generateSkills: missing DDB source data or character skills, skipping skill generation");
    return;
  }

  const addEffects = game.modules?.get("dae")?.active;

  if (!addEffects) (this.raw.character.flags as Record<string, any>)["skill-customization-5e"] = {};
  DICTIONARY.actor.skills.forEach((skill) => {
    const customProficient = this.getCustomSkillProficiency(skill);
    // we use !== undefined because the return value could be 0, which is falsey
    const proficient = customProficient !== undefined ? customProficient : this.getSkillProficiency(skill);

    // Skill bonuses
    const skillModifierBonus = DDBModifiers
      .filterBaseModifiers(ddb, "bonus", { subType: skill.subType })
      .map((skl) => parseInt(String(skl.value)))
      .reduce((a, b) => a + b, 0) ?? 0;
    const passiveBonus = DDBModifiers
      .filterBaseModifiers(ddb, "bonus", { subType: `passive-${skill.subType}` })
      .map((skl) => parseInt(String(skl.value)))
      .reduce((a, b) => a + b, 0) ?? 0;
    const customSkillBonus = this.getCustomSkillBonus(skill);
    const skillBonus = skillModifierBonus + customSkillBonus;
    const customAbility = this.getCustomSkillAbility(skill);
    const ability = customAbility !== undefined ? customAbility : skill.ability;

    // custom skill ability over ride effects
    if (customAbility) {
      const label = "Skill Ability Changes";
      const change: IActiveEffectChangeData = {
        key: `system.skills.${skill.name}.ability`,
        type: "override",
        value: `${customAbility}`,
        priority: 20,
      };

      const effects = this.raw.character.effects;
      if (!effects) {
        logger.warn("_generateSkills: character effects array missing, unable to add skill ability override effect", { skill, change });
      } else {
        const changeIndex = effects.findIndex((effect) => effect.name === label);
        if (changeIndex >= 0) {
          const existingEffect = effects[changeIndex];
          existingEffect.system ??= {};
          existingEffect.system.changes ??= [];
          existingEffect.system.changes.push(change);
        } else {
          const skillEffect = AutoEffects.generateBaseSkillEffect(ddb.character.id, label);
          skillEffect.system ??= {};
          skillEffect.system.changes ??= [];
          skillEffect.system.changes.push(change);
          effects.push(skillEffect);
        }
      }
    }

    skills[skill.name] = {
      value: proficient,
      ability: ability,
      bonuses: {
        check: `${skillBonus === 0 ? "" : skillBonus}`,
        passive: passiveBonus === 0 ? "" : String(passiveBonus),
      },
      roll: {
        min: null,
        max: null,
        mode: 0,
      },
    };
  });

  await this._generateCustomSkills();
  this._setSpecialSkills();

};
