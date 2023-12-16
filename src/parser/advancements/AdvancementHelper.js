import DICTIONARY from '../../dictionary.js';
import utils from '../../lib/utils.js';
import logger from '../../logger.js';

export default class AdvancementHelper {

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
      update.configuration.scale[key] = {
        value: value.n,
      };
    }
    adv.updateSource(update);

    return adv.toObject();
  }

  static addSingularDie(advancement) {
    const scaleValue = AdvancementHelper.convertToSingularDie(duplicate(advancement));

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

    const update = {
      configuration: {
        identifier: utils.referenceNameString(feature.name).toLowerCase(),
        type,
        scale: {},
      },
      value: {},
      title: feature.name,
    };

    feature.levelScales.forEach((scale) => {
      const die = scale.dice ? scale.dice : scale.die ? scale.die : undefined;
      if (type === "dice") {
        update.configuration.scale[scale.level] = {
          n: die.diceCount,
          die: die.diceValue,
        };
      } else if (type === "number") {
        update.configuration.scale[scale.level] = {
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
        update.configuration.scale[scale.level] = {
          value,
        };
      }
    });

    advancement.updateSource(update);

    return advancement.toObject();
  }

  static parseHTMLSaves(description) {
    const results = [];

    const textDescription = utils.stripHtml(description.replaceAll("<br />", "<br />\n"), true);

    // get class saves
    const savingText = textDescription.toLowerCase().split("saving throws:").pop().split("\n")[0].split("The")[0].split(".")[0].split("skills:")[0].trim();
    const saveRegex = /(.*)(?:$|The|\.$|\w+:)/im;
    const saveMatch = savingText.match(saveRegex);

    if (saveMatch) {
      const saveNames = saveMatch[1].replace(' and ', ',').split(',').map((ab) => ab.trim());
      const saves = saveNames
        .filter((name) => DICTIONARY.character.abilities.some((ab) => ab.long.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictAbility = DICTIONARY.character.abilities.find((ab) => ab.long.toLowerCase() === name.toLowerCase());
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
      allowReplacements: false,
    };
    const textDescription = utils.stripHtml(description.replaceAll("<br />", "<br />\n"), true).replace(/\s/g, " ");

    // Choose any three e.g. bard
    const anySkillRegex = /Skills:\sChoose any (\w+)(.*)($|\.$|\w+:)/im;
    const anyMatch = textDescription.match(anySkillRegex);

    if (anyMatch) {
      // const skills = DICTIONARY.character.skills.map((skill) => skill.name);
      const numberSkills = DICTIONARY.numbers.find((num) => anyMatch[1].toLowerCase() === num.natural);
      // eslint-disable-next-line require-atomic-updates
      parsedSkills.number = numberSkills ? numberSkills.num : 2;
      parsedSkills.choices = ["*"];
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

    if (skillMatch || oneOffMatch) {
      const match = skillMatch ?? oneOffMatch;
      const skillNames = match[2].replace(' and ', ',').replace(" or ", " ").split(',').map((skill) => skill.trim());
      const skills = skillNames
        .filter((name) => DICTIONARY.character.skills.some((skill) => skill.label.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictSkill = DICTIONARY.character.skills.find((skill) => skill.label.toLowerCase() === name.toLowerCase());
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
      const skills = explicitSkillGrantMatch[1].replace(",", " and").split(" and ").map((skill) => skill.trim());
      skills.forEach((grant) => {
        const dictSkill = DICTIONARY.character.skills
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
    const textDescription = utils.stripHtml(description.replaceAll("<br />", "<br />\n"), true);

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
      const languages = speakReadAndWriteMatch[1].replace(",", " and").split(" and ").map((skill) => skill.trim());
      parsedLanguages.number = 0;
      languages.forEach((grant) => {
        if (grant.includes("other language") || grant.includes("of your choice")) {
          parsedLanguages.number++;
          parsedLanguages.choices = ["*"];
        } else {
          const dictMatch = DICTIONARY.character.languages.find((l) => l.name.toLowerCase() === grant.toLowerCase());
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
    const directMatch = DICTIONARY.character.proficiencies.find((tool) =>
      tool.type === "Tool"
      && tool.name.toLowerCase() === utils.nameString(name).toLowerCase()
    );
    if (directMatch) return directMatch;

    const dictionaryTools = DICTIONARY.character.proficiencies.filter((tool) => tool.type === "Tool");
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

    const textDescription = utils.stripHtml(description.replaceAll("<br />", "<br />\n"), true);

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
      // const skills = DICTIONARY.character.skills.map((skill) => skill.name);
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
    const toolGrantsRegex = /^Tools:\s(.*?)($|\.|\w+:)/im;
    const toolGrantsMatch = textDescription.match(toolGrantsRegex);

    const toolChoiceRegex = /(\w+) type of (.*)($|\.|\w+:)/i;
    if (toolGrantsMatch) {
      const grantsArray = toolGrantsMatch[1].split(",").map((grant) => grant.trim());
      for (const toolString of grantsArray) {
        const toolChoiceMatch = toolString.match(toolChoiceRegex);
        if (toolChoiceMatch) {
          const numberTools = DICTIONARY.numbers.find((num) => toolChoiceMatch[1].toLowerCase() === num.natural);
          parsedTools.number = numberTools ? numberTools.num : 1;
          const toolGroup = AdvancementHelper.getToolGroup(toolChoiceMatch[2]);
          if (toolGroup) {
            parsedTools.choices.push(`${toolGroup}:*`);
          }
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
      const additionalMatches = additionalMatch[2].replace(",", " and").split(" and ").map((skill) => skill.trim());
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

  static ARMOR_GROUPS = DICTIONARY.character.proficiencies
    .filter((prof) => prof.type === "Armor" && hasProperty(prof, "foundryValue") && prof.advancement === "")
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
    const directMatch = DICTIONARY.character.proficiencies.find((prof) =>
      prof.type === "Armor" && hasProperty(prof, "foundryValue")
      && prof.name.toLowerCase() === utils.nameString(name).toLowerCase()
    );
    if (directMatch) return directMatch;

    const dictionaryProfs = DICTIONARY.character.proficiencies.filter((prof) =>
      prof.type === "Armor" && hasProperty(prof, "foundryValue")
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
    const textDescription = utils.stripHtml(description.replaceAll("<br />", "<br />\n"), true);

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
        if (stub) {
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
      const additionalMatches = additionalMatch[2].replace(",", " and").split(" and ").map((m) => m.trim());
      for (const grant of additionalMatches) {
        const stub = AdvancementHelper.getArmorAdvancementValue(grant);
        if (stub) {
          parsedArmorProficiencies.grants.push(stub);
        }
      }
    }

    return parsedArmorProficiencies;
  }

  static WEAPON_GROUPS = DICTIONARY.character.proficiencies
    .filter((prof) =>
      prof.type === "Weapon"
      && getProperty(prof, "foundryValue") !== ""
      && prof.advancement === ""
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
    const match = DICTIONARY.character.proficiencies.find((prof) =>
      prof.type === "Weapon"
      && getProperty(prof, "foundryValue") !== ""
      && (prof.name.toLowerCase() === utils.nameString(name).toLowerCase()
        || `${prof.name.toLowerCase()}s` === utils.nameString(name).toLowerCase()
        || `the ${prof.name.toLowerCase()}` === utils.nameString(name).toLowerCase())
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

  // eslint-disable-next-line complexity
  static parseHTMLWeaponProficiencies(description) {
    const parsedWeaponsProficiencies = {
      choices: [],
      grants: [],
      number: 0,
    };


    const textDescription = utils.stripHtml(description.replaceAll("<br />", "<br />\n"), true);

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
      const additionalMatches = additionalMatch[2].replace(",", " and").split(" and ").map((skill) => skill.trim());
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
            const weapons = DICTIONARY.character.proficiencies.filter((prof) =>
              prof.type === "Weapon"
              && getProperty(prof, "foundryValue") !== ""
              && getProperty(prof, "properties.two") !== true
              && getProperty(prof, "melee") === true
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
      const weapons = DICTIONARY.character.proficiencies.filter((prof) =>
        prof.type === "Weapon"
        && getProperty(prof, "foundryValue") !== ""
        && getProperty(prof, "properties.spc") !== true
        && (getProperty(prof, "properties.hvy") !== true || prof.name === "Longbow")
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

  // TODO : parse expertises

  //   return parsedExpertises;
  // }

  static parseHTMLEquipment(description) {
    const parsedEquipment = {
      choices: [],
      grants: [],
      number: 0,
    };
    const textDescription = utils.stripHtml(description.replaceAll("<br />", "<br />\n"), true);

    // You start with the following equipment, in addition to the equipment granted by your background:
    // any two simple weapons of your choice
    // a light crossbow and 20 bolts
    // your choice of studded leather armor or scale mail
    // thieves’ tools and a dungeoneer’s pack

    // You start with the following equipment, in addition to the equipment granted by your background:

    // (a) a greataxe or (b) any martial melee weapon
    // (a) two handaxes or (b) any simple weapon
    // An explorer’s pack and four javelins



    // TODO : parse equipment

    return parsedEquipment;
  }

}
