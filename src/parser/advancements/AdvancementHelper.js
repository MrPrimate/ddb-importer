import { DICTIONARY, SETTINGS } from '../../config/_module.mjs';
import { utils, logger, CompendiumHelper } from '../../lib/_module.mjs';
import { AutoEffects } from '../enrichers/effects/_module.mjs';
import { DDBModifiers } from '../lib/_module.mjs';

function htmlToText(html) {
  // keep html brakes and tabs
  return html.replace(/<\/td>/g, "\n")
    .replace(/<\/table>/g, "\n")
    .replace(/<\/tr>/g, "\n")
    .replace(/<\/p>/g, "\n")
    .replace(/<\/div>/g, "\n")
    .replace(/<\/h>/g, "\n")
    .replace(/<br>/g, "\n")
    .replace(/<br( )*\/>/g, "\n")
    .replace(/<[A-Za-z/][^<>]*>/g, "");
}

export default class AdvancementHelper {

  constructor({ ddbData, type, dictionary = null, isMuncher = false, isSubclass = false }) {
    this.ddbData = ddbData;
    this.type = type;
    this.isMuncher = isMuncher;
    this.dictionary = dictionary;
    this.isSubclass = isSubclass;
  }

  static stripDescription(description) {
    const descriptionReplaced = description
      .replaceAll(/<br \/>(?:\s*)*/g, "<br />\n")
      .replaceAll(/<\/p>(?:\s*)*/g, "</p>\n")
      .replaceAll(/<\/dt>(?:\s*)*<dt>/g, "</dt>\n<dt>");
    // console.warn(descriptionReplaced);
    return htmlToText(descriptionReplaced);
    // return utils.stripHtml(descriptionReplaced, true);
  }

  static getChoiceReplacements(description, lowestLevel, choices = {}, forceReplace = false) {
    const replaceRegex = /you can replace/i;
    const replace = replaceRegex.test(description);

    if (replace || forceReplace) {
      for (const level of utils.arrayRange(20, 1, 1)) {
        if (parseInt(level) < parseInt(lowestLevel)) continue;
        foundry.utils.setProperty(choices, `${level}.replacement`, true);
      }
    } else {
      for (const level of Object.keys(choices)) {
        foundry.utils.setProperty(choices, `${level}.replacement`, false);
      }
    }

    return choices;
  }


  getSkillChoicesFromOptions(feature, level, proficiencyFeatures = []) {
    const skillsChosen = new Set();
    const skillChoices = new Set();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[this.type].filter((choice) =>
      // check all features
      ((feature === null && proficiencyFeatures.some((f) => f.id === choice.componentId && f.requiredLevel === level))
      // check specific feature
       || (feature && feature.id === choice.componentId && feature.requiredLevel === level))
      && choice.subType === 1
      && choice.type === 2,
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.actor.skills.find((skill) => skill.label === option.label);
      if (smallChosen) skillsChosen.add(smallChosen.name);
      const optionNames = optionChoice.options.filter((option) =>
        DICTIONARY.actor.skills.some((skill) => skill.label === option.label)
        && choice.optionIds.includes(option.id),
      ).map((option) =>
        DICTIONARY.actor.skills.find((skill) => skill.label === option.label).name,
      );
      optionNames.forEach((skill) => {
        skillChoices.add(skill);
      });
    });

    return {
      chosen: Array.from(skillsChosen),
      choices: Array.from(skillChoices),
    };
  }

  getToolChoicesFromOptions(feature, level) {
    const toolsChosen = new Set();
    const toolChoices = new Set();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[this.type].filter((choice) =>
      feature.id === choice.componentId
      && feature.requiredLevel === level
      && choice.subType === 1
      && choice.type === 2,
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.actor.proficiencies.find((prof) => prof.type === "Tool" && prof.name === option.label);
      if (smallChosen) {
        const toolStub = smallChosen.toolType === ""
          ? smallChosen.baseTool
          : `${smallChosen.toolType}:${smallChosen.baseTool}`;
        toolsChosen.add(toolStub);
      }
      const optionNames = optionChoice.options
        .filter((option) =>
          DICTIONARY.actor.proficiencies.some((prof) => prof.type === "Tool" && prof.name === option.label)
          && choice.optionIds.includes(option.id),
        )
        .map((option) =>
          DICTIONARY.actor.proficiencies.find((prof) => prof.type === "Tool" && prof.name === option.label),
        );
      optionNames.forEach((tool) => {
        const toolStub = tool.toolType === ""
          ? tool.baseTool
          : `${tool.toolType}:${tool.baseTool}`;
        toolChoices.add(toolStub);
      });
    });

    return {
      chosen: Array.from(toolsChosen),
      choices: Array.from(toolChoices),
    };
  }

  getLanguageChoicesFromOptions(feature, level) {
    const languagesChosen = new Set();
    const languageChoices = new Set();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[this.type].filter((choice) =>
      feature.id === choice.componentId
      && feature.requiredLevel === level
      && choice.subType === 3
      && choice.type === 2,
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.actor.languages.find((lang) => lang.name === option.label);
      if (smallChosen) languagesChosen.add(smallChosen.value);
      const optionNames = optionChoice.options.filter((option) =>
        DICTIONARY.actor.languages.find((lang) => lang.name === option.label)
        && choice.optionIds.includes(option.id),
      ).map((option) =>
        DICTIONARY.actor.languages.find((lang) => lang.name === option.label).value,
      );
      optionNames.forEach((skill) => {
        languageChoices.add(skill);
      });
    });

    return {
      chosen: Array.from(languagesChosen),
      choices: Array.from(languageChoices),
    };
  }

  getChoicesFromOptions(feature, type, level, choiceType = null) {
    const chosen = new Set();
    const choices = new Set();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[choiceType ?? this.type].filter((choice) => {
      return feature.id === choice.componentId
        && feature.requiredLevel === level
        && choice.subType === 1
        && choice.type === 2;
    }).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.actor.proficiencies.find((prof) => prof.type === type && prof.name === option.label);
      if (smallChosen) {
        const stub = smallChosen.advancement === ""
          ? smallChosen.foundryValue
          : `${smallChosen.advancement}:${smallChosen.foundryValue}`;
        chosen.add(stub);
      }
      const optionNames = optionChoice.options
        .filter((option) =>
          DICTIONARY.actor.proficiencies.some((prof) => prof.type === type && prof.name === option.label)
          && choice.optionIds.includes(option.id),
        )
        .map((option) =>
          DICTIONARY.actor.proficiencies.find((prof) => prof.type === type && prof.name === option.label),
        );
      optionNames.forEach((prof) => {
        const stub = prof.advancement === ""
          ? prof.foundryValue
          : `${prof.advancement}:${prof.foundryValue}`;
        choices.add(stub);
      });
    });

    return {
      chosen: Array.from(chosen),
      choices: Array.from(choices),
    };
  }

  getExpertiseChoicesFromOptions(feature, level) {
    const skillsChosen = new Set();
    const skillChoices = new Set();
    const toolsChosen = new Set();
    const toolChoices = new Set();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[this.type].filter((choice) =>
      feature.id === choice.componentId
      && feature.requiredLevel === level
      && choice.subType === 2
      && choice.type === 2,
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosenSkill = DICTIONARY.actor.skills.find((skill) => skill.label === option.label);
      if (smallChosenSkill) skillsChosen.add(smallChosenSkill.name);
      const smallChosenTool = DICTIONARY.actor.proficiencies.find((p) => p.type === "Tool" && p.name === option.label);
      if (smallChosenTool) toolsChosen.add(smallChosenTool.baseTool);

      const skillOptionNames = optionChoice.options.filter((option) =>
        DICTIONARY.actor.skills.some((skill) => skill.label === option.label)
        && choice.optionIds.includes(option.id),
      ).map((option) =>
        DICTIONARY.actor.skills.find((skill) => skill.label === option.label).name,
      );
      skillOptionNames.forEach((skill) => {
        skillChoices.add(skill);
      });

      const toolOptionNames = optionChoice.options.filter((option) =>
        DICTIONARY.actor.proficiencies.find((p) => p.type === "Tool" && p.name === option.label)
        && choice.optionIds.includes(option.id),
      ).map((option) =>
        DICTIONARY.actor.proficiencies.find((p) => p.type === "Tool" && p.name === option.label).baseTool,
      );
      toolOptionNames.forEach((tool) => {
        toolChoices.add(tool);
      });
    });

    return {
      skills: {
        chosen: Array.from(skillsChosen),
        choices: Array.from(skillChoices),
      },
      tools: {
        chosen: Array.from(toolsChosen),
        choices: Array.from(toolChoices),
      },
    };
  }

  static advancementUpdate(advancement, { pool = [], chosen = [], count = 0, grants = [] } = {}) {
    if (grants.length > 0) {
      advancement.updateSource({
        configuration: {
          grants,
        },
        value: {
          chosen: grants,
        },
      });
    }
    if (pool.length > 0) {
      advancement.updateSource({
        configuration: {
          choices: [{
            count: count === 0 ? undefined : count,
            pool,
          }],
        },
      });
    }

    if (chosen.length > 0) {
      advancement.updateSource({
        value: {
          chosen,
        },
      });
    }
  }

  getSaveAdvancement(mods, availableToMulticlass, level) {
    const updates = DICTIONARY.actor.abilities
      .filter((ability) => {
        return DDBModifiers.filterModifiers(mods, "proficiency", { subType: `${ability.long}-saving-throws` }).length > 0;
      })
      .map((ability) => `saves:${ability.value}`);

    if (updates.length === 0) return null;

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
    advancement.updateSource({
      classRestriction: (level > 1 || this.isSubclass)
        ? ""
        : availableToMulticlass ? "secondary" : "primary",
      configuration: {
        grants: updates,
        allowReplacements: false,
      },
      level: level,
    });

    // add selection
    if (updates.length > 0) {
      advancement.updateSource({
        value: {
          chosen: updates,
        },
      });
    }

    return advancement;

  }

  // eslint-disable-next-line complexity
  getSkillAdvancement(mods, feature, availableToMulticlass, level, multiclassSkillCount = 0) {
    const baseProficiency = feature.name === "Proficiencies" || (feature.name.startsWith("Core") && feature.name.endsWith("Traits"));
    const skillsFromMods = mods
      .filter((mod) =>
        DICTIONARY.actor.skills.find((s) => s.label === mod.friendlySubtypeName),
      )
      .map((mod) =>
        DICTIONARY.actor.skills.find((s) => s.label === mod.friendlySubtypeName).name,
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedSkills = AdvancementHelper.parseHTMLSkills(feature.description);
    const chosenSkills = this.getSkillChoicesFromOptions(feature, level);

    const count = parsedSkills.number > 0 || parsedSkills.grants.length > 0
      ? parsedSkills.number
      : baseProficiency && availableToMulticlass
        ? multiclassSkillCount
        : mods.length;

    // console.warn(`Parsing skill advancement for level ${level}`, {
    //   availableToMulticlass,
    //   level,
    //   feature,
    //   mods,
    //   parsedSkills,
    //   chosenSkills,
    //   count,
    //   skillsFromMods,
    // });

    if (count === 0 && parsedSkills.grants.length === 0) return null;

    const classRestriction = availableToMulticlass === undefined || this.isSubclass
      ? undefined
      : level > 1 ? "" : availableToMulticlass ? "secondary" : "primary";

    const title = !baseProficiency && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ")
      ? feature.name
      : "Skill Proficiencies";

    advancement.updateSource({
      title,
      classRestriction,
      configuration: {
        allowReplacements: true,
      },
      level,
    });

    const pool = parsedSkills.choices.length > 0 || parsedSkills.grants.length > 0
      ? parsedSkills.choices.map((skill) => `skills:${skill}`)
      : skillsFromMods.map((choice) => `skills:${choice}`);

    const chosen = this.isMuncher || chosenSkills.chosen.length > 0
      ? chosenSkills.chosen.map((choice) => `skills:${choice}`)
        .concat(parsedSkills.grants.map((grant) => `skills:${grant}`))
      : skillsFromMods.map((choice) => `skills:${choice}`);

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedSkills.grants.map((grant) => `skills:${grant}`),
    });

    // console.warn("Final skill advancement", {
    //   advancement
    // });

    return advancement;
  }


  getLanguageAdvancement(mods, feature, level) {
    const languagesMods = DDBModifiers.filterModifiers(mods, "language");

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedLanguages = AdvancementHelper.parseHTMLLanguages(feature.description);
    const chosenLanguages = this.getLanguageChoicesFromOptions(feature, level);

    const languagesFromMods = languagesMods
      .filter((mod) => DICTIONARY.actor.languages.find((lang) => lang.name === mod.friendlySubtypeName))
      .map((mod) => {
        const language = DICTIONARY.actor.languages.find((lang) => lang.name === mod.friendlySubtypeName);
        return language.advancement ? `${language.advancement}:${language.value}` : language.value;
      });

    const count = parsedLanguages.number > 0 || parsedLanguages.grants.length > 0
      ? parsedLanguages.number !== 0
        ? parsedLanguages.number
        : 1
      : languagesMods.length;

    // console.warn(`Languages`, {
    //   i: level,
    //   languageFeature: feature,
    //   mods,
    //   languagesMods,
    //   parsedLanguages,
    //   chosenLanguages,
    //   languagesFromMods,
    //   languageCount: count,
    // });

    if (count === 0 && parsedLanguages.grants.length === 0) return null;

    const pool = parsedLanguages.choices.length > 0 || parsedLanguages.grants.length > 0
      ? parsedLanguages.choices.map((choice) => `languages:${choice}`)
      : languagesFromMods.map((choice) => `languages:${choice}`);

    const chosen = this.isMuncher || chosenLanguages.chosen.length > 0
      ? chosenLanguages.chosen.map((choice) => `languages:${choice}`)
        .concat(parsedLanguages.grants.map((grant) => `languages:${grant}`))
      : languagesFromMods.map((choice) => `languages:${choice}`);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ")
        ? feature.name
        : "Languages",
      configuration: {
        allowReplacements: true,
      },
      level: level,
    });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count: count,
      grants: parsedLanguages.grants.map((grant) => `languages:${grant}`),
    });

    return advancement;
  }

  getToolAdvancement(mods, feature, level) {
    const proficiencyMods = DDBModifiers.filterModifiers(mods, "proficiency");
    const toolMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.actor.proficiencies
          .some((prof) => prof.type === "Tool" && prof.name === mod.friendlySubtypeName),
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedTools = AdvancementHelper.parseHTMLTools(feature.description);
    const chosenTools = this.getToolChoicesFromOptions(feature, level);

    const toolsFromMods = toolMods.map((mod) => {
      const tool = DICTIONARY.actor.proficiencies
        .find((prof) => prof.type === "Tool" && prof.name === mod.friendlySubtypeName);
      return tool.toolType === ""
        ? tool.baseTool
        : `${tool.toolType}:${tool.baseTool}`;
    });

    const count = parsedTools.number > 0 || parsedTools.grants.length > 0
      ? parsedTools.number > 0
        ? parsedTools.number
        : 1
      : toolMods.length;

    // console.warn(`Tools`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   toolMods,
    //   parsedTools,
    //   chosenTools,
    //   toolsFromMods,
    //   count,
    // });

    if (count === 0 && parsedTools.grants.length === 0) return null;

    const pool = parsedTools.choices.length > 0 || parsedTools.grants.length > 0
      ? parsedTools.choices.map((choice) => `tool:${choice}`)
      : toolsFromMods.map((choice) => `tool:${choice}`);

    const chosen = this.isMuncher || chosenTools.chosen.length > 0
      ? chosenTools.chosen.map((choice) => `tool:${choice}`)
        .concat(parsedTools.grants.map((grant) => `tool:${grant}`))
      : toolsFromMods.map((choice) => `tool:${choice}`);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ")
        ? feature.name
        : "Tool Proficiencies",
      configuration: {
        allowReplacements: true,
      },
      level: level,
    });

    // console.warn("tools", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedTools.grants.map((grant) => `tool:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedTools.grants.map((grant) => `tool:${grant}`),
    });

    return advancement;
  }

  getArmorAdvancement(mods, feature, availableToMulticlass, level) {
    const proficiencyMods = DDBModifiers.filterModifiers(mods, "proficiency");
    const armorMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.actor.proficiencies
          .some((prof) => prof.type === "Armor" && prof.name === mod.friendlySubtypeName),
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedArmors = AdvancementHelper.parseHTMLArmorProficiencies(feature.description);
    const chosenArmors = this.getChoicesFromOptions(feature, "Armor", level);

    const armorsFromMods = armorMods.map((mod) => {
      const armor = DICTIONARY.actor.proficiencies
        .find((prof) => prof.type === "Armor" && prof.name === mod.friendlySubtypeName);
      return armor.advancement === ""
        ? armor.foundryValue
        : `${armor.advancement}:${armor.foundryValue}`;
    });

    const count = parsedArmors.number > 0 || parsedArmors.grants.length > 0
      ? parsedArmors.number > 0
        ? parsedArmors.number
        : 1
      : armorMods.length;

    // console.warn(`Armor`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   toolMods: armorMods,
    //   parsedArmors,
    //   chosenArmors,
    //   armorsFromMods,
    //   count,
    // });

    if (count === 0 && parsedArmors.grants.length === 0) return null;

    const classRestriction = availableToMulticlass === undefined || this.isSubclass
      ? undefined
      : level > 1 ? "" : availableToMulticlass ? "secondary" : "primary";

    const pool = parsedArmors.choices.length > 0 || parsedArmors.grants.length > 0
      ? parsedArmors.choices.map((choice) => `armor:${choice}`)
      : armorsFromMods.map((choice) => `armor:${choice}`);

    const chosen = this.isMuncher || chosenArmors.chosen.length > 0
      ? chosenArmors.chosen.map((choice) => `armor:${choice}`)
        .concat(parsedArmors.grants.map((grant) => `armor:${grant}`))
      : armorsFromMods.map((choice) => `armor:${choice}`);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ")
        ? feature.name
        : "Armor Training",
      classRestriction,
      configuration: {
        allowReplacements: false,
      },
      level: level,
    });

    // console.warn("tools", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedTools.grants.map((grant) => `tool:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedArmors.grants.map((grant) => `armor:${grant}`),
    });

    return advancement;
  }

  getWeaponAdvancement(mods, feature, level) {
    const proficiencyMods = DDBModifiers.filterModifiers(mods, "proficiency");
    const weaponMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.actor.proficiencies
          .some((prof) => prof.type === "Weapon" && prof.name === mod.friendlySubtypeName),
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedWeapons = AdvancementHelper.parseHTMLWeaponProficiencies(feature.description);
    const chosenWeapons = this.getChoicesFromOptions(feature, "Weapon", level);

    const weaponsFromMods = weaponMods.map((mod) => {
      const weapon = DICTIONARY.actor.proficiencies
        .find((prof) => prof.type === "Weapon" && prof.name === mod.friendlySubtypeName);
      return weapon.advancement === ""
        ? weapon.foundryValue
        : `${weapon.advancement}:${weapon.foundryValue}`;
    });

    const count = parsedWeapons.number > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.number > 0
        ? parsedWeapons.number
        : 1
      : weaponMods.length;

    // console.warn(`Weapon`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   armorMods: weaponMods,
    //   parsedArmors: parsedWeapons,
    //   chosenArmors: chosenWeapons,
    //   armorsFromMods: weaponsFromMods,
    //   count,
    // });

    if (count === 0 && parsedWeapons.grants.length === 0) return null;

    const pool = parsedWeapons.choices.length > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.choices.map((choice) => `weapon:${choice}`)
      : weaponsFromMods.map((choice) => `weapon:${choice}`);


    const chosen = this.isMuncher || chosenWeapons.chosen.length > 0
      ? chosenWeapons.chosen.map((choice) => `weapon:${choice}`)
        .concat(parsedWeapons.grants.map((grant) => `weapon:${grant}`))
      : weaponsFromMods.map((choice) => `weapon:${choice}`);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ")
        ? feature.name
        : "Weapon Proficiencies",
      configuration: {
        mode: "default",
        allowReplacements: false,
      },
      level: level,
    });

    // console.warn("weapons", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    });

    return advancement;
  }

  //   {
  //     "fixedValue": null,
  //     "id": "62627888",
  //     "entityId": 4,
  //     "entityTypeId": 1782728300,
  //     "type": "weapon-mastery",
  //     "subType": "sap-longsword",
  //     "dice": null,
  //     "restriction": "",
  //     "statId": null,
  //     "requiresAttunement": false,
  //     "duration": null,
  //     "friendlyTypeName": "Weapon Mastery",
  //     "friendlySubtypeName": "Sap (Longsword)",
  //     "isGranted": true,
  //     "bonusTypes": [],
  //     "value": null,
  //     "availableToMulticlass": true,
  //     "modifierTypeId": 43,
  //     "modifierSubTypeId": 1942,
  //     "componentId": 1789142,
  //     "componentTypeId": 1088085227,
  //     "tagConstraints": []
  // },

  getWeaponMasteryAdvancement(mods, feature, level) {
    const proficiencyMods = DDBModifiers.filterModifiers(mods, "weapon-mastery");
    const weaponMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.actor.proficiencies
          .some((prof) => {
            const weaponRegex = /(\w+) \(([\w ]+)\)/ig;
            const masteryDetails = weaponRegex.exec(mod.friendlySubtypeName);
            if (!masteryDetails) return false;
            return prof.type === "Weapon" && prof.name === masteryDetails[2];
          }),
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedWeapons = AdvancementHelper.parseHTMLWeaponMasteryProficiencies(feature.description);
    const chosenWeapons = this.getChoicesFromOptions(feature, "Weapon", level);

    const weaponsFromMods = weaponMods.map((mod) => {
      const weapon = DICTIONARY.actor.proficiencies
        .find((prof) => {
          const weaponRegex = /(\w+) \(([\w ]+)\)/ig;
          const masteryDetails = weaponRegex.exec(mod.friendlySubtypeName);
          if (!masteryDetails) return false;
          return prof.type === "Weapon" && prof.name === masteryDetails[2];
        });
      return weapon.advancement === ""
        ? weapon.foundryValue
        : `${weapon.advancement}:${weapon.foundryValue}`;
    });

    const count = parsedWeapons.number > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.number > 0
        ? parsedWeapons.number
        : 1
      : weaponMods.length;

    // console.warn(`Weapon Mastery`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   weaponMods,
    //   parsedWeapons,
    //   chosenWeapons,
    //   weaponsFromMods,
    //   count,
    // });

    if (count === 0 && parsedWeapons.grants.length === 0) return null;

    const pool = parsedWeapons.choices.length > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.choices.map((choice) => `weapon:${choice}`)
      : weaponsFromMods.map((choice) => `weapon:${choice}`);


    const chosen = this.isMuncher || chosenWeapons.chosen.length > 0
      ? chosenWeapons.chosen.map((choice) => `weapon:${choice}`)
        .concat(parsedWeapons.grants.map((grant) => `weapon:${grant}`))
      : weaponsFromMods.map((choice) => `weapon:${choice}`);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ")
        ? feature.name
        : "Weapon Masteries",
      configuration: {
        mode: "mastery",
        allowReplacements: true,
      },
      level: level,
    });

    // console.warn("weapons", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    });

    return advancement;
  }

  getExpertiseAdvancement(feature, level) {
    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
    const expertiseOptions = this.getExpertiseChoicesFromOptions(feature, level);

    // add HTML Parsing to improve this at a later date

    const pool = feature.name === "Survivalist"
      ? ["skills:prc", "skills:nat"]
      : feature.name === "Expertise"
        ? ["skills:*", "tool:thief"]
        : ["skills:*"];

    const grants = feature.name === "Survivalist"
      ? pool
      : [];

    const count = feature.name === "Survivalist"
      ? 0
      : expertiseOptions.length > 0
        ? expertiseOptions.length
        : 2;

    advancement.updateSource({
      title: feature.name === "Survivalist" ? `${feature.name} (Expertise)` : `${feature.name}`,
      configuration: {
        allowReplacements: false,
        mode: "expertise",
      },
      level: level,
    });

    const chosenSkills = expertiseOptions.skills.chosen.map((skill) => `skills:${skill}`);
    const chosenTools = expertiseOptions.tools.chosen.map((tool) => `tool:${tool}`);
    const chosen = [].concat(chosenSkills, chosenTools, grants);

    AdvancementHelper.advancementUpdate(advancement, {
      chosen,
      pool,
      count,
      grants,
    });

    // console.warn("Generated expertise advancement", advancement)

    return advancement;

  }

  static CONDITION_ID_MAPPING = {
    1: "dr",
    2: "di",
    3: "dv",
    4: "ci",
  };

  getConditionAdvancement(mods, feature, level) {
    const conditionsFromMods = [];
    ["resistance", "immunity", "vulnerability", "immunity"].forEach((condition, i) => {
      const proficiencyMods = DDBModifiers.filterModifiers(mods, condition, { restriction: null });
      const conditionId = i + 1;
      const conditionData = AutoEffects.getGenericConditionAffectData(proficiencyMods, condition, conditionId, true);
      const conditionValues = new Set(conditionData.map((result) => `${AdvancementHelper.CONDITION_ID_MAPPING[conditionId]}:${result.value}`));
      // console.warn("Individual Parse", {
      //   proficiencyMods,
      //   condition,
      //   conditionId,
      //   conditionData,
      //   conditionValues,
      // });
      conditionsFromMods.push(...conditionValues);
    });

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedConditions = AdvancementHelper.parseHTMLConditions(feature.description);

    const count = parsedConditions.number > 0 || parsedConditions.grants.length > 0
      ? parsedConditions.number > 0
        ? parsedConditions.number
        : 1
      : conditionsFromMods.length;

    // console.warn(`Conditions`, {
    //   level,
    //   feature,
    //   mods,
    //   conditionsFromMods,
    //   parsedConditions,
    //   count,
    // });

    if (count === 0 && parsedConditions.grants.length === 0) return null;

    const pool = this.isMuncher || parsedConditions.choices.length > 0 || parsedConditions.grants.length > 0
      ? parsedConditions.choices.map((choice) => choice)
      : conditionsFromMods.map((choice) => choice);

    const chosen = this.isMuncher
      ? parsedConditions.grants.map((grant) => grant)
      : conditionsFromMods.map((choice) => choice);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ")
        ? feature.name
        : "",
      configuration: {
        allowReplacements: false,
        hint: parsedConditions.hint,
      },
      level: level,
    });

    // console.warn("conditions", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedConditions.grants.map((grant) => grant),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedConditions.grants.map((grant) => grant),
    });

    return advancement;
  }

  // Feats with multichoices
  // You gain proficiency in any combination of three skills or tools of your choice.

  static convertToSingularDie(advancement) {
    advancement.title += ` (Die)`;
    for (const key of Object.keys(advancement.configuration.scale)) {
      advancement.configuration.scale[key].n = 1;
    }
    return advancement;
  }

  static renameTotal(advancement) {
    advancement.title += ` (Total)`;
    return advancement;
  }

  static rename(advancement, { newName = null, identifier = null } = {}) {
    if (newName) advancement.title = newName;
    if (identifier) advancement.configuration.identifier = identifier;
    return advancement;
  }

  static addAdditionalUses(advancement) {
    const adv = new game.dnd5e.documents.advancement.ScaleValueAdvancement();
    const update = {
      configuration: {
        identifier: `${advancement.configuration.identifier}-uses`,
        type: "number",
        scale: {},
      },
      title: `${advancement.title} (Uses)`,
    };

    for (const [key, value] of Object.entries(advancement.configuration.scale)) {
      // console.warn("key", {key, value});
      update.configuration.scale[key] = {
        value: value.number,
      };
    }
    adv.updateSource(update);

    return adv.toObject();
  }

  static addSingularDie(advancement) {
    const scaleValue = AdvancementHelper.convertToSingularDie(foundry.utils.duplicate(advancement));

    scaleValue._id = foundry.utils.randomID();
    scaleValue.configuration.identifier = `${advancement.configuration.identifier}-die`;

    return scaleValue;
  }

  static generateScaleValueAdvancement(feature) {
    // distance, number, dice, anything
    let type = "string";
    const die = feature.levelScales[0]?.dice
      ? feature.levelScales[0]?.dice
      : feature.levelScales[0]?.die
        ? feature.levelScales[0]?.die
        : undefined;

    if (die?.diceString && (!die.fixedValue || die.fixedValue === "")) {
      type = "dice";
    } else if (feature.levelScales[0].fixedValue
      && feature.levelScales[0].fixedValue !== ""
      && Number.isInteger(feature.levelScales[0].fixedValue)
    ) {
      type = "number";
    }

    const advancement = new game.dnd5e.documents.advancement.ScaleValueAdvancement();

    const name = utils.nameString(feature.name);

    const update = {
      configuration: {
        identifier: utils.referenceNameString(name).toLowerCase(),
        type,
        scale: {},
      },
      value: {},
      title: name,
    };

    feature.levelScales.forEach((scale) => {
      const level = Math.max(scale.level, feature.requiredLevel ?? 1);
      const die = scale.dice ? scale.dice : scale.die ? scale.die : undefined;
      if (type === "dice") {
        update.configuration.scale[level] = {
          n: die.diceCount,
          die: die.diceValue,
        };
      } else if (type === "number") {
        update.configuration.scale[level] = {
          value: scale.fixedValue,
        };
      } else {
        let value = (die.diceString && die.diceString !== "")
          ? die.diceString
          : "";
        if (die.fixedValue && die.fixedValue !== "") {
          value += ` + ${die.fixedValue}`;
        }
        if (value === "") {
          value = scale.description;
        }
        update.configuration.scale[level] = {
          value,
        };
      }
    });

    advancement.updateSource(update);

    return advancement.toObject();
  }

  static parseHTMLSaves(description) {
    const results = [];

    const textDescription = AdvancementHelper.stripDescription(description);

    // get class saves
    const savingText = textDescription.toLowerCase().split("saving throws:").pop().split("\n")[0].split("The")[0].split(".")[0].split("skills:")[0].trim();
    const saveRegex = /(.*)(?:$|The|\.$|\w+:)/im;
    const saveMatch = savingText.match(saveRegex);

    if (saveMatch) {
      const saveNames = saveMatch[1].replace(' and ', ',').split(',').map((ab) => ab.trim());
      const saves = saveNames
        .filter((name) => DICTIONARY.actor.abilities.some((ab) => ab.long.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictAbility = DICTIONARY.actor.abilities.find((ab) => ab.long.toLowerCase() === name.toLowerCase());
          return dictAbility.value;
        });
      results.push(...saves);
    }
    return results;
  }

  static parseHTMLSkills(description) {
    const parsedSkills = {
      choices: [],
      grants: [],
      number: 0,
      allowReplacements: true,
    };
    const textDescription = AdvancementHelper.stripDescription(description).replace(/\s/g, " ");

    // Choose any three e.g. bard
    const anySkillRegex = /Skills:\sChoose any (\w+)(.*)($|\.$|\w+:)/im;
    const anyMatch = textDescription.match(anySkillRegex);

    if (anyMatch) {
      // const skills = DICTIONARY.actor.skills.map((skill) => skill.name);
      const numberSkills = DICTIONARY.numbers.find((num) => anyMatch[1].toLowerCase() === num.natural);
      // eslint-disable-next-line require-atomic-updates
      parsedSkills.number = numberSkills ? numberSkills.num : 2;
      parsedSkills.choices = ["*"];
      return parsedSkills;
    }

    // Skill Proficiencies: Nature, Survival
    const backgroundSkillRegex = /Skill Proficiencies:\s(.*?)($|\.$|\w+:)/im;
    const backgroundMatch = textDescription.match(backgroundSkillRegex);

    if (backgroundMatch) {
      const skills = backgroundMatch[1].replace(" and ", ",").split(",").map((skill) => skill.trim());
      skills.forEach((grant) => {
        const dictSkill = DICTIONARY.actor.skills
          .find((skill) =>
            skill.label.toLowerCase() === grant.toLowerCase().split(" ")[0]
            || grant.toLowerCase().includes(skill.label.toLowerCase()),
          );
        if (dictSkill) parsedSkills.grants.push(dictSkill.name);
      });
      return parsedSkills;
    }

    // most other class profs
    // Skills: Choose two from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, and Survival
    const skillText = textDescription.toLowerCase().split("skills:").pop().split("\n")[0].split("the")[0].split(".")[0].trim();
    const skillRegex = /choose (\w+)(?:\sskills)* from (.*)($|The|\.|\w+:)/im;
    const skillMatch = skillText.match(skillRegex);

    // common feature choice
    // you gain proficiency in one of the following skills of your choice: Deception, Performance, or Persuasion.
    // you gain proficiency with two of the following skills of your choice: Deception, Insight, Intimidation
    const oneOffRegex = /you gain proficiency (?:in|with) (\w+) of the following skills of your choice:\s(.*?)(\.|$)/im;
    const oneOffMatch = textDescription.match(oneOffRegex);

    // You also become proficient in your choice of two of the following skills: Arcana, History, Nature, or Religion.
    const twoRegex = /also become proficient in your choice of (\w+) of the following skills:\s(.*?)(\.|$)/im;
    const twoMatch = textDescription.match(twoRegex);

    if (skillMatch || oneOffMatch || twoMatch) {
      const match = skillMatch ?? oneOffMatch ?? twoMatch;
      const skillNames = match[2].replace(' and ', ',').replace(" or ", " ").split(',').map((skill) => skill.trim());
      const skills = skillNames
        .filter((name) => DICTIONARY.actor.skills.some((skill) => skill.label.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictSkill = DICTIONARY.actor.skills.find((skill) => skill.label.toLowerCase() === name.toLowerCase());
          return dictSkill.name;
        });
      const numberSkills = DICTIONARY.numbers.find((num) => match[1].toLowerCase() === num.natural);
      parsedSkills.number = numberSkills ? numberSkills.num : 2;
      parsedSkills.choices = skills;
      return parsedSkills;
    }

    // no more matches, return.
    if (!textDescription.includes("proficiency")) return parsedSkills;

    // You gain proficiency in one skill of your choice.
    // You gain proficiency in an additional skill or learn a new language of your choice.
    // You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.
    const additionalMatchRegex = /You gain (?:one skill proficiency of your choice|proficiency in (?:an additional skill|one skill of your choice))/im;
    const additionalMatch = textDescription.match(additionalMatchRegex);

    if (additionalMatch) {
      parsedSkills.number = 1;
      parsedSkills.choices = ["*"];
      return parsedSkills;
    }

    // You gain proficiency in the Intimidation skill.
    // You gain proficiency in the Insight and Medicine skills, and you
    // you gain proficiency in the Performance skill if you don’t already have it.
    const explicitSkillGrantRegex = /You gain proficiency in the (.*) skill( if you don’t already have it)?/i;
    const explicitSkillGrantMatch = textDescription.match(explicitSkillGrantRegex);

    if (explicitSkillGrantMatch) {
      const skills = explicitSkillGrantMatch[1].replace(" and ", ",").split(",").map((skill) => skill.trim());
      skills.forEach((grant) => {
        const dictSkill = DICTIONARY.actor.skills
          .find((skill) => skill.label.toLowerCase() === grant.toLowerCase());
        if (dictSkill) parsedSkills.grants.push(dictSkill.name);
      });
      return parsedSkills;
    }

    // not matches, so return empty parsed set
    return parsedSkills;
  }

  static parseHTMLLanguages(description) {
    const parsedLanguages = {
      grants: [],
      choices: [],
      number: 0,
    };
    const textDescription = AdvancementHelper.stripDescription(description);

    // Background languages
    const languagesRegex = /Languages:\s(.*?)($|\.$|\w+:)/im;
    const languagesMatch = textDescription.match(languagesRegex);

    // Languages: Giant and one other language of your choice
    // Languages: Any one of your choice
    // Languages: one of your choice
    // Languages: One of your choice of Elvish, Gnomish, Goblin, or Sylvan
    // Languages: Two of your choice
    if (languagesMatch) {
      const choiceRegexComplex = /(?:(\w+)?(?: and))?\s?(?:(\w+)(?: other language)*)\sof\syour\schoice(?: of (.*))*/im;
      const complexMatch = languagesMatch[1].match(choiceRegexComplex);
      if (complexMatch) {
        if (complexMatch[1]) {
          const dictMatch = DICTIONARY.actor.languages.find((l) =>
            l.name.toLowerCase() === complexMatch[1].split(" ")[0].toLowerCase().trim()
            || complexMatch[1].toLowerCase().includes(l.name.toLowerCase()),
          );
          if (dictMatch) {
            const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
            parsedLanguages.grants.push(language);
          }
        }
        if (complexMatch[2]) {
          const number = DICTIONARY.numbers.find((num) => complexMatch[2].toLowerCase().trim() === num.natural);
          parsedLanguages.number = number ? number.num : 1;
          if (complexMatch[3]) {
            const languages = complexMatch[3].replace(" or ", ",").split(",").map((skill) => skill.trim());
            languages.forEach((choice) => {
              const dictMatch = DICTIONARY.actor.languages.find((l) =>
                l.name.toLowerCase() === choice.toLowerCase().split(" ")[0]
                || choice.toLowerCase().includes(l.name.toLowerCase()),
              );
              if (dictMatch) {
                const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
                parsedLanguages.choices.push(language);
              }
            });
          } else {
            parsedLanguages.choices = ["*"];
          }
        }
        return parsedLanguages;
      }

      // Languages: Choose one of Draconic, Goblin, or Vedalken
      const choiceOfRegex = /choose (\w+)(?: of (.*))*/im;
      const simpleChoice = textDescription.match(choiceOfRegex);
      if (simpleChoice) {
        const number = DICTIONARY.numbers.find((num) => simpleChoice[1].toLowerCase().trim() === num.natural);
        parsedLanguages.number = number ? number.num : 1;
        if (simpleChoice[2]) {
          const languages = simpleChoice[2].replace(" or ", ",").split(",").map((skill) => skill.trim());
          languages.forEach((choice) => {
            const dictMatch = DICTIONARY.actor.languages.find((l) =>
              l.name.toLowerCase() === choice.toLowerCase().split(" ")[0]
              || choice.toLowerCase().includes(l.name.toLowerCase()),
            );
            // console.warn("lang check", {
            //   simple: simpleChoice[2],
            //   choice,
            //   languages,
            //   matchVal: choice.toLowerCase().split(" ")[0],
            //   dictMatch,
            // });
            if (dictMatch) {
              const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
              parsedLanguages.choices.push(language);
            }
          });
        } else {
          parsedLanguages.choices = ["*"];
        }

        return parsedLanguages;
      }

      // Languages: Draconic or Elven
      parsedLanguages.number = 1;
      if (languagesMatch[1]) {
        const languages = languagesMatch[1].replace(" or ", ",").split(",").map((skill) => skill.trim());
        languages.forEach((choice) => {
          const dictMatch = DICTIONARY.actor.languages.find((l) => l.name.toLowerCase() === choice.toLowerCase());
          if (dictMatch) {
            const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
            parsedLanguages.choices.push(language);
          }
        });
        return parsedLanguages;
      }
    }

    // you learn one language of your choice.
    // You also learn two languages of your choice.
    // You gain proficiency in an additional skill or learn a new language of your choice.
    // learn one language of your choice that is spoken by your
    const ofYourChoiceRegex = /learn (\w+?|a new) language(?:s)? of your choice/im;
    const ofYourChoiceMatch = textDescription.match(ofYourChoiceRegex);

    if (ofYourChoiceMatch) {
      const number = DICTIONARY.numbers.find((num) => ofYourChoiceMatch[1].toLowerCase() === num.natural);
      parsedLanguages.number = number ? number.num : 2;
      parsedLanguages.choices = ["*"];
      return parsedLanguages;
    }

    // You can speak, read, and write Common and Dwarvish.
    // You can speak, read, and write Common and Elvish.
    // You can speak, read, and write Common and one extra language of your choice
    // Your character can speak, read, and write Common and one other language that
    // You learn to speak, read, and write Sylvan.
    // You gain proficiency with smith’s tools, and you learn to speak, read, and write Giant.
    const speakReadAndWriteRegex = /speak, read, and write (.*?)(?:\.|$)/im;
    const speakReadAndWriteMatch = textDescription.match(speakReadAndWriteRegex);

    if (speakReadAndWriteMatch) {
      const languages = speakReadAndWriteMatch[1].replace(" and ", ",").split(",").map((skill) => skill.trim());
      parsedLanguages.number = 0;
      languages.forEach((grant) => {
        if (grant.includes("other language") || grant.includes("of your choice")) {
          parsedLanguages.number++;
          parsedLanguages.choices = ["*"];
        } else {
          const dictMatch = DICTIONARY.actor.languages.find((l) => l.name.toLowerCase() === grant.toLowerCase());
          if (dictMatch) {
            const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
            parsedLanguages.grants = [language];
          }
        }

      });
      return parsedLanguages;
    }

    // You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.
    const featMatchRegex = /fluency in (\w+) language(?:s)? of your choice/i;
    const featMatch = textDescription.match(featMatchRegex);

    if (featMatch) {
      const number = DICTIONARY.numbers.find((num) => featMatch[1].toLowerCase() === num.natural);
      parsedLanguages.number = number ? number.num : 1;
      parsedLanguages.number = 1;
      parsedLanguages.choices = ["*"];
      return parsedLanguages;
    }

    return parsedLanguages;
  }

  static TOOL_GROUPS = {
    "musical instrument": "music",
    "gaming set": "game",
    "artisan's tools": "art",
    "vehicle": "vehicle",
  };

  static getToolGroup(text) {
    for (const [key, value] of Object.entries(AdvancementHelper.TOOL_GROUPS)) {
      if (utils.nameString(text).toLowerCase().includes(key)) return value;
    }
    return null;
  }

  static getDictionaryTool(name) {
    const directMatch = DICTIONARY.actor.proficiencies.find((tool) =>
      tool.type === "Tool"
      && tool.name.toLowerCase() === utils.nameString(name).toLowerCase(),
    );
    if (directMatch) return directMatch;

    const dictionaryTools = DICTIONARY.actor.proficiencies.filter((tool) => tool.type === "Tool");
    for (const tool of dictionaryTools) {
      if (utils.nameString(name).toLowerCase().includes(tool.name.toLowerCase())) return tool;
    }
    return null;
  }

  static getToolAdvancementValue(text) {
    const match = AdvancementHelper.getDictionaryTool(text);
    if (match) {
      const stub = match.toolType === ""
        ? match.baseTool
        : `${match.toolType}:${match.baseTool}`;
      return stub;
    }
    return null;
  }

  // eslint-disable-next-line complexity
  static parseHTMLTools(description) {
    const parsedTools = {
      choices: [],
      grants: [],
      number: 0,
    };

    const textDescription = AdvancementHelper.stripDescription(description);

    // Tools: None
    if (textDescription.includes("Tools: None")) return parsedTools;

    // Tools: Choose one type of artisan’s tools or one musical instrument
    const anyToolsRegex = /^Tools:\sChoose (\w+) type of (.*)($|\.|\w+:)/im;
    const anyMatch = textDescription.match(anyToolsRegex);
    // Tools: Three musical instruments of your choice
    const anyToolsRegex2 = /^Tools:\s(\w+)\s(.*) of your choice($|\.|\w+:)/im;
    const anyMatch2 = textDescription.match(anyToolsRegex2);

    if (anyMatch || anyMatch2) {
      const match = anyMatch ?? anyMatch2;
      // const skills = DICTIONARY.actor.skills.map((skill) => skill.name);
      const numberTools = DICTIONARY.numbers.find((num) => match[1].toLowerCase() === num.natural);
      parsedTools.number = numberTools ? numberTools.num : 2;
      const toolArray = match[2].split(" or ");
      for (const toolString of toolArray) {
        const toolGroup = AdvancementHelper.getToolGroup(toolString);
        if (toolGroup) {
          parsedTools.choices.push(`${toolGroup}:*`);
        } else {
          logger.error(`Could not find tool group for ${toolString}, please log an issue`);
        }
      }
      return parsedTools;
    }

    // Tools: Thieves' tools, tinker's tools, one type of artisan's tools of your choice
    // Tools: Herbalism kit
    // Tool Proficiencies: Disguise Kit, one type of Gaming Set or Musical Instrument
    const toolGrantsRegex = /^(?:Tools|Tool Proficiencies):\s(.*?)($|\.|\w+:)/im;
    const toolGrantsMatch = textDescription.match(toolGrantsRegex);

    const toolChoiceRegex = /(\w+) type of (.*)($|\.|\w+:)/i;
    if (toolGrantsMatch) {
      const grantsArray = toolGrantsMatch[1].split(",").map((grant) => grant.trim());
      for (const toolString of grantsArray) {
        const toolChoiceMatch = toolString.match(toolChoiceRegex);
        if (toolChoiceMatch) {
          const numberTools = DICTIONARY.numbers.find((num) => toolChoiceMatch[1].toLowerCase() === num.natural);
          parsedTools.number = numberTools ? numberTools.num : 1;
          toolChoiceMatch[2].split(" or ").forEach((toolGroupMatch) => {
            const toolGroup = AdvancementHelper.getToolGroup(toolGroupMatch.trim());
            if (toolGroup) {
              parsedTools.choices.push(`${toolGroup}:*`);
            }
          });
        } else {
          const stub = AdvancementHelper.getToolAdvancementValue(toolString);
          if (stub) {
            parsedTools.grants.push(stub);
          }
        }
      }
      return parsedTools;
    }

    // no more matches, return.
    if (!textDescription.includes("proficiency")) return parsedTools;


    // You gain proficiency with alchemist’s supplies. If you already have this proficiency, you gain proficiency with one other type of artisan’s tools of your choice.
    // You also gain proficiency with smith’s tools.
    // You gain proficiency with woodcarver’s tools.
    // you gain proficiency with heavy armor and smith’s tools
    // you gain proficiency with one type of artisan’s tools of your choice.
    // You gain proficiency with smith’s tools, and you learn to speak, read, and write Giant.
    // and you gain proficiency with the herbalism kit.
    // You also gain proficiency with brewer’s supplies if you don’t already have it.
    // you gain proficiency with the disguise kit and the poisoner’s kit.
    // you gain proficiency with the disguise kit, the forgery kit, and one gaming set of your choice.
    // you gain proficiency with Tinker’s Tools

    const additionalMatchRegex = /You gain proficiency with (.*?)($|\.|\w+:)/im;
    const additionalMatch = textDescription.match(additionalMatchRegex);

    if (additionalMatch) {
      const additionalMatches = additionalMatch[2].replace(" and ", ",").split(",").map((skill) => skill.trim());
      for (const match of additionalMatches) {
        const toolChoiceRegex = /(\w+) (.*?) of your choice($|\.|\w+:)/i;
        const choiceMatch = textDescription.match(toolChoiceRegex);
        if (choiceMatch) {
          const numberTools = DICTIONARY.numbers.find((num) => choiceMatch[1].toLowerCase() === num.natural);
          parsedTools.number = numberTools ? numberTools.num : 1;
          const toolGroup = AdvancementHelper.getToolGroup(choiceMatch[2]);
          if (toolGroup) {
            parsedTools.choices.push(`${toolGroup}:*`);
          }
        } else {
          const stub = AdvancementHelper.getToolAdvancementValue(match);
          if (stub) {
            parsedTools.grants.push(stub);
          }
        }
      }

      return parsedTools;
    }

    // You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.
    const featMatchRegex = /(\w*) tool proficiency of your choice/i;
    const featMatch = textDescription.match(featMatchRegex);

    if (featMatch) {
      parsedTools.number = 1;
      parsedTools.choices = ["*"];
      return parsedTools;
    }

    return parsedTools;
  }

  static ARMOR_GROUPS = DICTIONARY.actor.proficiencies
    .filter((prof) => prof.type === "Armor" && foundry.utils.hasProperty(prof, "foundryValue") && prof.advancement === "")
    .reduce((acc, prof) => {
      acc[prof.name.toLowerCase()] = prof.foundryValue;
      return acc;
    }, {});

  static getArmorGroup(text) {
    for (const [key, value] of Object.entries(AdvancementHelper.ARMOR_GROUPS)) {
      if (utils.nameString(text).toLowerCase().includes(key)) return value;
    }
    return null;
  }

  static getDictionaryArmor(name) {
    const directMatch = DICTIONARY.actor.proficiencies.find((prof) =>
      prof.type === "Armor" && foundry.utils.hasProperty(prof, "foundryValue")
      && prof.name.toLowerCase() === utils.nameString(name).toLowerCase(),
    );
    if (directMatch) return directMatch;

    const dictionaryProfs = DICTIONARY.actor.proficiencies.filter((prof) =>
      prof.type === "Armor" && foundry.utils.hasProperty(prof, "foundryValue"),
    );
    for (const prof of dictionaryProfs) {
      if (utils.nameString(name).toLowerCase().includes(prof.name.toLowerCase())) return prof;
    }
    return null;
  }

  static getArmorAdvancementValue(text) {
    const match = AdvancementHelper.getDictionaryArmor(text);
    if (match) {
      const stub = match.advancement === ""
        ? match.foundryValue
        : `${match.advancement}:${match.foundryValue}`;
      return stub;
    }
    return null;
  }

  static parseHTMLArmorProficiencies(description) {
    const parsedArmorProficiencies = {
      choices: [],
      grants: [],
      number: 0,
    };
    const textDescription = AdvancementHelper.stripDescription(description);

    // Armor: None
    if (textDescription.includes("Armor: None")) return parsedArmorProficiencies;

    // Armor: Light armor, medium armor, shields
    // Armor: Light armor, medium armor, shields
    // Armor: All armor, shields
    const grantsRegex = /^Armor:\s(.*?)($|\.|\w+:)/im;
    const grantsMatch = textDescription.match(grantsRegex);

    if (grantsMatch) {
      const grantsArray = grantsMatch[1].split(",").map((grant) => grant.trim());
      for (const grant of grantsArray) {
        const stub = AdvancementHelper.getArmorAdvancementValue(grant);
        if (stub === "all") {
          parsedArmorProficiencies.grants.push("lgt", "med", "hvy");
        } else if (stub) {
          parsedArmorProficiencies.grants.push(stub);
        }
      }
      return parsedArmorProficiencies;
    }

    // no more matches, return.
    if (!textDescription.includes("proficiency")) return parsedArmorProficiencies;

    // You gain proficiency with heavy armor.
    // you gain proficiency with heavy armor and smith’s tools
    // You gain proficiency with light armor, and you gain proficiency with one type of one-handed melee weapon of your choice.

    const additionalMatchRegex = /You gain proficiency with (.*?)($|\.|\w+:)/im;
    const additionalMatch = textDescription.match(additionalMatchRegex);

    if (additionalMatch) {
      const additionalMatches = additionalMatch[2].replace(" and ", ",").split(",").map((m) => m.trim());
      for (const grant of additionalMatches) {
        const stub = AdvancementHelper.getArmorAdvancementValue(grant);
        if (stub) {
          parsedArmorProficiencies.grants.push(stub);
        }
      }
    }

    return parsedArmorProficiencies;
  }

  static WEAPON_GROUPS = DICTIONARY.actor.proficiencies
    .filter((prof) =>
      prof.type === "Weapon"
      && foundry.utils.getProperty(prof, "foundryValue") !== ""
      && prof.advancement === "",
    )
    .reduce((acc, prof) => {
      acc[prof.name.toLowerCase()] = prof.foundryValue;
      return acc;
    }, {});

  static getWeaponGroup(text) {
    for (const [key, value] of Object.entries(AdvancementHelper.WEAPON_GROUPS)) {
      if (utils.nameString(text).toLowerCase().includes(key)) return value;
    }
    return null;
  }

  static getDictionaryWeapon(name) {
    const match = DICTIONARY.actor.proficiencies.find((prof) =>
      prof.type === "Weapon"
      && foundry.utils.getProperty(prof, "foundryValue") !== ""
      && (prof.name.toLowerCase() === utils.nameString(name).toLowerCase()
        || `${prof.name.toLowerCase()}s` === utils.nameString(name).toLowerCase()
        || `the ${prof.name.toLowerCase()}` === utils.nameString(name).toLowerCase()),
    );
    if (match) return match;
    return null;
  }

  static getWeaponAdvancementValue(text) {
    const match = AdvancementHelper.getDictionaryWeapon(text);
    if (match) {
      const stub = match.advancement === ""
        ? match.foundryValue
        : `${match.advancement}:${match.foundryValue}`;
      return stub;
    }
    return null;
  }

  // KNOWN_ISSUE_4_0
  // eslint-disable-next-line no-unused-vars
  static parseHTMLWeaponMasteryProficiencies(description) {
    const parsedWeaponsProficiencies = {
      // choices: DICTIONARY.actor.proficiencies
      //   .filter((prof) => prof.type === "Weapon" && prof.foundryValue && prof.foundryValue !== "")
      //   .map((prof) => prof.foundryValue),
      choices: ["*"],
      grants: [],
      number: 0,
    };
    return parsedWeaponsProficiencies;
  }

  // eslint-disable-next-line complexity
  static parseHTMLWeaponProficiencies(description) {
    const parsedWeaponsProficiencies = {
      choices: [],
      grants: [],
      number: 0,
    };


    const textDescription = AdvancementHelper.stripDescription(description);

    // Weapons: None
    if (textDescription.includes("Weapons: None")) return parsedWeaponsProficiencies;

    // Weapons: Simple weapons, martial weapons
    // Weapons: Simple weapons
    // Weapons: Simple weapons, hand crossbows, longswords, rapiers, shortswords
    const weaponGrantsRegex = /^Weapons:\s(.*?)($|\.|\w+:)/im;
    const weaponGrantsMatch = textDescription.match(weaponGrantsRegex);

    const weaponChoiceRegex = /(\w+) type of (.*)($|\.|\w+:)/i;
    if (weaponGrantsMatch) {
      const grantsArray = weaponGrantsMatch[1].split(",").map((grant) => grant.trim());
      for (const toolString of grantsArray) {
        const weaponChoiceMatch = toolString.match(weaponChoiceRegex);
        if (weaponChoiceMatch) {
          const number = DICTIONARY.numbers.find((num) => weaponChoiceMatch[1].toLowerCase() === num.natural);
          parsedWeaponsProficiencies.number = number ? number.num : 1;
          const group = AdvancementHelper.getWeaponGroup(weaponChoiceMatch[2]);
          if (group) {
            parsedWeaponsProficiencies.choices.push(`${group}:*`);
          }
        } else {
          const stub = AdvancementHelper.getWeaponAdvancementValue(toolString);
          if (stub) {
            parsedWeaponsProficiencies.grants.push(stub);
          }
        }
      }
      return parsedWeaponsProficiencies;
    }

    // no more matches, return.
    if (!textDescription.includes("proficiency")) return parsedWeaponsProficiencies;

    // you gain proficiency with medium armor and the scimitar.
    // You gain proficiency with martial weapons.
    // At 1st level, you gain proficiency with martial weapons and heavy armor.
    // You gain proficiency with light armor, and you gain proficiency with one type of one-handed melee weapon of your choice.
    // You gain proficiency with four weapons of your choice. Each one must be a simple or a martial weapon.
    const additionalMatchRegex = /You gain proficiency with (.*?)($|\.|\w+:)/im;
    const additionalMatch = textDescription.match(additionalMatchRegex);

    if (additionalMatch) {
      const additionalMatches = additionalMatch[2].replace(" and ", ",").split(",").map((skill) => skill.trim());
      for (const match of additionalMatches) {
        const toolChoiceRegex = /(\w+) (.*?) of your choice($|\.|\w+:)/i;
        const choiceMatch = textDescription.match(toolChoiceRegex);
        if (choiceMatch) {
          const numberTools = DICTIONARY.numbers.find((num) => choiceMatch[1].toLowerCase() === num.natural);
          parsedWeaponsProficiencies.number = numberTools ? numberTools.num : 1;
          const toolGroup = AdvancementHelper.getWeaponGroup(choiceMatch[2]);
          if (toolGroup) {
            parsedWeaponsProficiencies.choices.push(`${toolGroup}:*`);
            // eslint-disable-next-line max-depth
          } else if (choiceMatch[2].toLowerCase().includes("one-handed melee weapon")) {
            const weapons = DICTIONARY.actor.proficiencies.filter((prof) =>
              prof.type === "Weapon"
              && foundry.utils.getProperty(prof, "foundryValue") !== ""
              && foundry.utils.getProperty(prof, "properties.two") !== true
              && foundry.utils.getProperty(prof, "melee") === true,
            ).map((prof) => {
              const stub = prof.advancement === ""
                ? prof.foundryValue
                : `${prof.advancement}:${prof.foundryValue}`;
              return stub;
            });
            parsedWeaponsProficiencies.choices.push(...weapons);
          } else {
            logger.warn(`unknown weapon group choices ${choiceMatch[2]}`);
          }
        } else {
          const stub = AdvancementHelper.getWeaponAdvancementValue(match);
          if (stub) {
            parsedWeaponsProficiencies.grants.push(stub);
          }
        }
      }

      return parsedWeaponsProficiencies;
    }

    // Choose two types of weapons to be your kensei weapons: one melee weapon and one ranged weapon.
    const kenseiRegex = /Choose two types of weapons to be your kensei weapons/im;
    if (kenseiRegex.test(textDescription)) {
      parsedWeaponsProficiencies.number = 2;
      const weapons = DICTIONARY.actor.proficiencies.filter((prof) =>
        prof.type === "Weapon"
        && foundry.utils.getProperty(prof, "foundryValue") !== ""
        && foundry.utils.getProperty(prof, "properties.spc") !== true
        && (foundry.utils.getProperty(prof, "properties.hvy") !== true || prof.name === "Longbow"),
      ).map((prof) => {
        const stub = prof.advancement === ""
          ? prof.foundryValue
          : `${prof.advancement}:${prof.foundryValue}`;
        return stub;
      });
      parsedWeaponsProficiencies.choices.push(...weapons);
    }

    return parsedWeaponsProficiencies;
  }

  // static parseHTMLExpertises(description) {
  //   const parsedExpertises = {
  //     choices: [],
  //     grants: [],
  //     number: 2,
  //   };

  //   const dom = utils.htmlToDocumentFragment(description);

  //   // At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves’ tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.
  //   // At 6th level, you can choose two more of your proficiencies (in skills or with thieves’ tools) to gain this benefit.
  //   // At 3rd level, choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.
  //   // At 6th level, choose two more of your skill proficiencies, or one more of your skill proficiencies and your proficiency with thieves’ tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.
  // // Choose one skill in which you have proficiency. You gain expertise with that skill,
  // Your proficiency bonus is doubled for any check you make with the chosen skills.

  // parse expertises

  //   return parsedExpertises;
  // }


  static parseHTMLSpellCastingAbilities(description) {
    const result = {
      hint: "",
      abilities: [],
    };

    // Intelligence, Wisdom, or Charisma is your spellcasting ability for it
    // Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait
    // Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells when you cast them with this trait
    // Constitution is your spellcasting ability for this spell.
    const abilityRegex = /(Intelligence, Wisdom, or Charisma|Intelligence|Wisdom|Charisma|Constitution) is your spellcasting ability for/i;
    const abilityMatches = abilityRegex.exec(description);
    if (abilityMatches) {
      if (abilityMatches[1].includes("Intelligence, Wisdom, or Charisma")) {
        result.hint = "You can choose Intelligence, Wisdom, or Charisma as your spellcasting ability for these spells.";
      }
      result.abilities = abilityMatches[1].replace(" or ", ",").replaceAll(",,", ",").split(",").map((ability) =>
        ability.trim().toLowerCase().substr(0, 3),
      );
    } else {
      // the spell uses the same spellcasting ability
      const otherTraitRegex = /When you cast it with this trait, the spell uses the same spellcasting ability./i;
      const otherTraitMatch = description.match(otherTraitRegex);
      if (otherTraitMatch) {
        result.hint = otherTraitMatch[0];
        result.abilities = ["int", "wis", "cha"];
      }
    }


    return result;
  }

  static parseHTMLSpellAdvancementData(description) {
    const result = {
      spellListCantripChoice: null,
      cantripChoices: [],
      cantripGrants: [],
      spellGrants: [],
      spellChoices: [],
      hint: "",
    };
    const spellsAdded = new Set();
    const strippedDescription = AdvancementHelper.stripDescription(description);

    const spellListRegex = /You know one cantrip of your choice from the (\w+) spell list/i;
    const spellListMatch = strippedDescription.match(spellListRegex);

    if (spellListMatch) {
      result.hint = `You know one cantrip of your choice from the ${spellListMatch[1]} spell list.`;
      result.spellListCantripChoice = spellListMatch[1].toLowerCase();
    }

    // You know one of the following cantrips of your choice: dancing lights, light, or sacred flame.
    if (strippedDescription.includes("one of the following cantrips of your choice")) {
      const choices = strippedDescription.split("one of the following cantrips of your choice:")
        .slice(1)[0]
        .split(".")[0]
        .replace(" or ", ",")
        .replaceAll(",,", ",")
        .split(",")
        .map((cantrip) => cantrip.toLowerCase().trim());
      for (const choice of choices) {
        if (spellsAdded.has(choice)) continue;
        result.cantripChoices.push(choice);
        spellsAdded.add(choice);
      }
    }

    // You also know the Poison Spray cantrip.
    // You know the shocking grasp cantrip.
    // You know the druidcraft cantrip.
    // You know the mage hand cantrip, and the hand is invisible when you cast the cantrip with this trait.
    const cantripGrantRegex = /You (?:also )?know the ([\w /]+) cantrip/ig;
    const cantripGrants = strippedDescription.matchAll(cantripGrantRegex);
    for (const match of cantripGrants) {
      const cantrips = match[1]
        .replace(" and ", ",")
        .replaceAll(",,", ",")
        .split(",")
        .map((cantrip) => cantrip.toLowerCase().trim());
      for (const cantrip of cantrips) {
        if (spellsAdded.has(cantrip)) continue;
        result.cantripGrants.push(cantrip);
        spellsAdded.add(cantrip);
      }
    }

    // Starting at 3rd level, you can cast the feather fall spell with this trait, without requiring a material component. Starting at 5th level, you can also cast the levitate spell with this trait, without requiring a material component.
    // Starting at 3rd level, you can also cast suggestion with this trait.
    // Starting at 3rd level, you can cast the disguise self spell with this trait. Starting at 5th level, you can also cast the nondetection spell with it, without requiring a material component.
    // Starting at 3rd level, you can cast the enlarge/reduce spell on yourself with this trait, without requiring a material component. Starting at 5th level, you can also cast the invisibility spell on yourself with this trait, without requiring a material component.
    // Starting at 5th level, you can cast the pass without trace spell with this trait, without requiring a material component.
    // Starting at 3rd level, you can cast the faerie fire spell with this trait. Starting at 5th level, you can also cast the enlarge/reduce spell with this trait.
    //  When you reach 3rd level, you can cast the create or destroy water spell as a 2nd-level spell once with this trait, and you regain the ability to cast it this way when you finish a long rest

    const startingAtRegex = /(?:Starting at|When you reach) (\d+)(?:st|nd|rd|th) level, you can (?:also )?cast (?:the )?(.+?)(?: spell)?(?:spell on yourself)? (?:with this trait|as a|with it)/ig;
    const startingAtMatches = strippedDescription.matchAll(startingAtRegex);
    for (const match of startingAtMatches) {
      const spells = match[2]
        .replace(" and ", ",")
        .replaceAll(",,", ",")
        .split(",")
        .map((cantrip) => cantrip.toLowerCase().trim());

      for (const spell of spells) {
        if (spellsAdded.has(spell)) continue;
        const level = parseInt(match[1]);
        spellsAdded.add(spell);
        result.spellGrants.push({
          level: level,
          name: spell,
        });
      }
    }

    // You can cast the detect magic and disguise self spells with this trait. When you use this version of disguise self, you can seem up to 3 feet shorter or taller. Once you cast either of these spells with this trait, you can’t cast that spell with it again until you finish a long rest.
    // You can cast the levitate spell once with this trait, requiring no material components, and you regain the ability to cast it this way when you finish a long rest.
    // You can cast animal friendship an unlimited number of times with this trait, but you can target only snakes with it.
    const canCastRegex = /you can (?:also )?cast (?:the )?(.+?)(?: spells?)? (once |an unlimited number of times |on yourself |as a \d+(?:st|nd|rd|th)[- ]level spell once )?with this trait/ig;

    const canCastMatches = strippedDescription.matchAll(canCastRegex);
    for (const match of canCastMatches) {
      const spells = match[1].split(" and ").map((s) => s.toLowerCase().trim());
      const unlimited = match[2] && match[2].includes("unlimited");
      for (const spell of spells) {
        if (spellsAdded.has(spell)) continue;
        spellsAdded.add(spell);
        result.spellGrants.push({
          level: 1,
          name: spell,
          amount: unlimited ? "" : "1",
        });
      }
    }

    // When you reach character levels 3 and 5, you learn a higher-level spell, as shown on the table

    return result;
  }

  static parseHTMLPTagSpellAdvancementData({ description, species } = {}) {

    const dom = utils.htmlToDocumentFragment(description);

    const pTags = dom.querySelectorAll('p strong');

    let result;

    pTags.forEach((pTag) => {
      const textContent = pTag.textContent.trim().replace(".", "");
      if (textContent.toLowerCase() === species.toLowerCase()) {
        result = AdvancementHelper.parseHTMLSpellAdvancementData(pTag.parentNode.innerHTML); ;
      }
    });
    return result || AdvancementHelper.parseHTMLSpellAdvancementData(description);

  }

  static parseHTMLTableSpellAdvancementData({ description, species } = {}) {
    const dom = utils.htmlToDocumentFragment(description);

    const rows = dom.querySelectorAll('table tbody tr');
    const lineages = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const lineage = {
          name: cells[0].textContent.trim(),
          one: cells[1].textContent.trim(),
          three: cells[2].textContent.trim(),
          five: cells[3].textContent.trim(),
        };
        lineages.push(lineage);
      }
    });

    const lineageMatch = lineages.find((l) => l.name.toLowerCase() === species.toLowerCase());

    if (!lineageMatch) return AdvancementHelper.parseHTMLSpellAdvancementData(description);

    const adjustedDescription = `${lineageMatch.one}
Starting at 3rd level, you can cast the ${lineageMatch.three} spell with this trait.
Starting at 5th level, you can cast the ${lineageMatch.five} spell with this trait.`;

    const result = AdvancementHelper.parseHTMLSpellAdvancementData(adjustedDescription);

    return result;
  }


  static CONDITION_MAPPING = {
    "resistance": "dr",
    "immunity": "di",
    "immune": "di",
    "vulnerability": "dv",
    // "condition": "ci",
  };

  // eslint-disable-next-line complexity
  static parseHTMLConditions(description) {
    const grants = new Set();
    const choices = new Set();
    const parsedConditions = {
      choices: [],
      grants: [],
      number: 0,
      hint: "",
    };

    const textDescription = AdvancementHelper.stripDescription(description).toLowerCase();

    // quick and dirty damage matches, 90 % of use cases
    const isObviousDamage = textDescription.includes("damage");
    const adjustedText = textDescription.replaceAll(" damage", "");

    if (isObviousDamage) {
      // You have resistance to psychic damage
      // You have resistance to necrotic damage and radiant damage.
      // you gain resistance to lightning and thunder damage
      // You gain immunity to fire damage.
      // you gain immunity to lightning and thunder damage.
      // You also have resistance to psychic damage
      // and you have resistance to poison damage.
      // You have resistance to poison damage and immunity to disease, and you have advantage on saving throws against being paralyzed or poisoned.
      // you gain resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.
      // the paladin gains resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.
      // You gain resistance to acid damage and poison damage,
      // You also have resistance to poison damage.
      // You are immune to poison damage and the poisoned condition.
      // You have resistance to acid and poison damage, and you have advantage on saving throws against being poisoned.
      const damageRegex = /(?:you|the paladin) (?:also have|have|gains*|are) ([^advantage].*) to (.*?)($|\.|and you have advantage|\w+:)/im;
      const damageMatch = adjustedText.match(damageRegex);
      if (damageMatch) {
        const additionalMatches = damageMatch[2]
          .replace(" and ", ",").split(",")
          .map((dmg) => dmg.trim().toLowerCase());
        for (const match of additionalMatches) {
          const conditionKind = damageMatch[1].toLowerCase().trim();
          const damageMapping = DICTIONARY.actor.damageAdjustments.find((a) =>
            a.kind === conditionKind // only match the kind
            && a.type !== 4 // don't include conditions
            && match === a.name.toLowerCase(),
          );
          if (damageMapping) {
            const type = AdvancementHelper.CONDITION_MAPPING[conditionKind];
            const valueData = foundry.utils.hasProperty(damageMapping, "foundryValues")
              ? foundry.utils.getProperty(damageMapping, "foundryValues")
              : foundry.utils.hasProperty(damageMapping, "foundryValue")
                ? { value: damageMapping.foundryValue }
                : undefined;
            // eslint-disable-next-line max-depth, no-continue
            if (!valueData) continue;
            const midiValues = game.modules.get("midi-qol")?.active && valueData.midiValues
              ? valueData.midiValues
              : [];
            const mappingValueArray = midiValues.concat(valueData.value).map((value) => value.toLowerCase());
            mappingValueArray.forEach((value) => {
              if (type) grants.add(`${type}:${value}`);
              if (type === "di" && value === "poison") {
                grants.add("ci:poisoned");
              }
            });
          }
        }
      }
    }

    const isImmunity = textDescription.includes("immunity") || textDescription.includes("immune");
    // You have resistance to poison damage and immunity to disease,
    // You are immune to being charmed,
    // you makes you immune to disease.
    // you makes you immune to disease and poison.
    // and you are immune to the poisoned condition.
    // You are immune to poison damage and the poisoned condition.
    // You are immune to disease.
    if (isImmunity) {
      const immuneRegex = /(?:you have|and|you are|makes you) (?:immune|immunity) to (.*?)($|\.|and you have advantage|\w+:)/im;
      const immuneMatch = textDescription.match(immuneRegex);
      if (immuneMatch) {
        let addPoisonDI = false;
        const additionalMatches = immuneMatch[1]
          .replace(" and ", ",")
          .split(",")
          .map((dmg) => {
            const result = dmg.trim().toLowerCase();
            if (dmg === "poison") {
              addPoisonDI = true;
              return "poisoned";
            } else if (dmg === "disease") return "diseased";
            else return result;
          });
        for (const match of additionalMatches) {
          const conditionMapping = DICTIONARY.actor.damageAdjustments.find((a) =>
            a.kind === "immunity" // only match the immunity kind
            && a.type === 4 // dont include damage adjustments
            && match === a.name.toLowerCase(),
          );
          if (conditionMapping) {
            grants.add(`ci:${conditionMapping.foundryValue}`);
            // eslint-disable-next-line max-depth
            if (addPoisonDI && conditionMapping.foundryValue === "poisoned") grants.add("di:poison");
          }
        }
      }

    }

    // These are special types
    // You have resistance to the damage type associated with your * Ancestry.
    const dragonMatch = textDescription.match(/resistance to the damage type associated with your (\w*) Ancestry/mi);
    if (dragonMatch) {
      parsedConditions.count = 1;
      parsedConditions.hint = textDescription;
      switch (dragonMatch[1].toLowerCase()) {
        case "metallic": {
          ["fire", "lightning", "acid", "cold"].forEach((dr) => {
            if (textDescription.includes(dr)) {
              choices.add(`dr:${dr}`);
            }
          });
          break;
        }
        case "chromatic": {
          ["acid", "lightning", "poison", "fire", "cold"].forEach((dr) => {
            if (textDescription.includes(dr)) {
              choices.add(`dr:${dr}`);
            }
          });
          break;
        }
        case "gem": {
          ["force", "radiant", "psychic", "thunder", "necrotic"].forEach((dr) => {
            if (textDescription.includes(dr)) {
              choices.add(`dr:${dr}`);
            }
          });
          break;
        }
        default: {
          ["acid", "lightning", "poison", "fire", "acid", "cold"].forEach((dr) => {
            if (textDescription.includes(dr)) {
              choices.add(`dr:${dr}`);
            }
          });
          break;
        }
      }
    }

    // You now have resistance to a damage type determined by your patron’s kind:
    if (textDescription.includes("resistance to a damage type determined by your patron’s kind:")) {
      parsedConditions.count = 1;
      parsedConditions.hint = textDescription;
      ["bludgeoning", "thunder", "fire", "cold"].forEach((dr) => {
        if (textDescription.includes(dr)) {
          choices.add(`dr:${dr}`);
        }
      });
    }

    // You have resistance to all damage dealt by other creatures (their attacks, spells, and other effects).
    if (textDescription.includes("resistance to all damage dealt by other creatures")) {
      grants.add("dr:all");
      Object.keys(CONFIG.DND5E.damageTypes).forEach((dr) => {
        grants.add(`dr:${dr}`);
      });
    }

    // NOT IMPLEMENTED: Foundry doesn't support these kind of things they are not really condition resistances etc
    // and you have advantage on saving throws against being poisoned.
    // You and friendly creatures within 10 feet of you have resistance to damage from spells.
    // You have advantage on Intelligence, Wisdom, and Charisma saving throws against spells.
    // You have advantage on saving throws you make to avoid or end the poisoned condition on yourself.
    // You have advantage on saving throws against spells and other magical effects.
    // and you have advantage on saving throws against being paralyzed or poisoned.

    parsedConditions.grants = Array.from(grants);
    parsedConditions.choices = Array.from(choices);
    return parsedConditions;
  }

  // static parseHTMLEquipment(description) {
  //   const parsedEquipment = {
  //     choices: [],
  //     grants: [],
  //     number: 0,
  //   };
  //   const textDescription = AdvancementHelper.stripDescription(description);

  //   // You start with the following equipment, in addition to the equipment granted by your background:
  //   // any two simple weapons of your choice
  //   // a light crossbow and 20 bolts
  //   // your choice of studded leather armor or scale mail
  //   // thieves’ tools and a dungeoneer’s pack

  //   // You start with the following equipment, in addition to the equipment granted by your background:

  //   // (a) a greataxe or (b) any martial melee weapon
  //   // (a) two handaxes or (b) any simple weapon
  //   // An explorer’s pack and four javelins

  //   // parse equipment here

  //   return parsedEquipment;
  // }


  // static getEquipmentAdvancement(parts) {

  // }

  static async getCompendiumSpellUuidsFromNames(names, use2024Spells = false) {
    const spellChoice = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-force-spell-version");
    const spells = await CompendiumHelper.retrieveCompendiumSpellReferences(names, {
      use2024Spells: spellChoice === "FORCE_2024" || use2024Spells,
    });

    return spells;
  }

  static async getCantripChoiceAdvancement({
    choices = [], abilities = [], hint = "", name, spellListChoice = null, spellLinks,
    is2024,
  } = {}) {
    if (choices.length === 0 && !spellListChoice) return undefined;
    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();
    const uuids = await AdvancementHelper.getCompendiumSpellUuidsFromNames(choices, is2024);

    spellLinks.push({
      type: "choice",
      advancementId: advancement._id,
      choices,
      uuids,
      level: 0,
    });

    advancement.updateSource({
      title: name,
      hint,
      configuration: {
        allowDrops: false,
        pool: uuids.map((s) => {
          return { uuid: s.uuid };
        }),
        choices: {
          "0": {
            count: 1,
            replacement: false,
          },
          replacement: {
            count: null,
            replacement: false,
          },
        },
        restriction: {
          level: "0",
          type: "spell",
        },
        type: "spell",
        spell: {
          ability: abilities,
          preparation: "",
          uses: {
            max: "",
            per: "",
            requireSlot: false,
          },
        },
      },
    });
    if (uuids.length > 0 || spellListChoice) return advancement;

    return undefined;
  }

  static async getCantripGrantAdvancement({
    choices = [], abilities = [], hint = "", name, spellLinks, is2024,
  } = {}) {
    if (choices.length === 0) return undefined;
    const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
    const uuids = await AdvancementHelper.getCompendiumSpellUuidsFromNames(choices, is2024);

    spellLinks.push({
      type: "grant",
      advancementId: advancement._id,
      choices,
      uuids,
      level: 1,
    });

    advancement.updateSource({
      title: name,
      level: 1,
      configuration: {
        items: uuids.map((s) => {
          return {
            uuid: s.uuid,
            optional: false,
          };
        }),
        type: "spell",
        spell: {
          ability: abilities,
          method: "spell",
          prepared: CONFIG.DND5E.spellPreparationStates.always.value,
          uses: {
            max: "",
            per: "",
            requireSlot: false,
          },
        },
      },
      hint,
    });
    if (uuids.length > 0) return advancement;

    return undefined;
  }

  static async getSpellGrantAdvancement({
    spellGrants, abilities = [], hint = "", name, spellLinks, method = "innate",
    requireSlot = false, prepared = CONFIG.DND5E.spellPreparationStates.always.value,
    level, is2024,
  } = {}) {
    const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
    const spellGrant = spellGrants[0];
    const uuids = await AdvancementHelper.getCompendiumSpellUuidsFromNames(spellGrants.map((g) => g.name), is2024);

    spellLinks.push({
      type: "grant",
      advancementId: advancement._id,
      choices: spellGrants,
      uuids,
      level: level ?? spellGrant.level,
    });

    advancement.updateSource({
      title: name,
      level: level ? parseInt(level) : parseInt(spellGrant.level),
      configuration: {
        items: uuids.map((s) => {
          return {
            uuid: s.uuid,
            optional: false,
          };
        }),
        type: "spell",
        spell: {
          ability: abilities,
          method,
          prepared,
          uses: spellGrant.amount
            ? {
              max: spellGrant.amount === "" ? "" : spellGrant.amount,
              per: spellGrant.amount === "" ? "" : "lr",
              requireSlot,
            }
            : {
              max: "",
              per: "",
              requireSlot,
            },
        },
      },
      hint,
    });

    if (uuids.length > 0) return advancement;
    return advancement;
  }

}
