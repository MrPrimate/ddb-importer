import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import FileHelper from "../../lib/FileHelper.js";
import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";
import { generateTable } from "../table.js";
import { parseTags } from "../../lib/DDBTemplateStrings.js";
import utils from "../../lib/utils.js";

const CLASS_TEMPLATE = {
  "name": "",
  "type": "feat",
  "system": {
    "description": {
      "value": "",
      "chat": "",
      "unidentified": ""
    },
    "source": "",
  },
  "sort": 2600000,
  "flags": {
    "ddbimporter": {
      "type": "class",
    },
    "obsidian": {
      "source": {
        "type": "class",
        "text": ""
      }
    },
  },
  "img": null
};

export const NO_TRAITS = [
  "Speed",
  "Size",
  "Feat",
  "Languages",
  "Hit Points",
  "Proficiencies",
];

export const FEATURE_DUP = [
  "Ability Score Increase",
  "Ability Score Improvement",
  "Expertise",
  "Fighting Style",
  "Land's Stride",
  "Otherworldly Patron",
  "Pact Magic",
  "Potent Spellcasting",
  "Timeless Body",
  "Unarmored Defense",
  "Circle Spells",
  "Divine Strike",
  "Evasion",
  "Channel Divinity",
  "Expanded Spell List",
  "Oath Spells",
  "Psionic Power",
  "Psychic Blades",
  "Spellcasting",
  "Primal Companion",
  "Domain Spells",
  "Bonus Cantrip",
  "Bonus Cantrips",
  "Bonus Proficiencies",
  "Bonus Proficiency",
  "Extra Attack",
  "Tool Proficiency",
];

function buildBase(data) {
  let result = duplicate(CLASS_TEMPLATE);
  const updateExisting = game.settings.get("ddb-importer", "munching-policy-update-existing");

  result.name = data.name;
  const tableDescription = generateTable(data.name, data.description, updateExisting);
  result.system.description.value += `${tableDescription}\n\n`;

  result.flags.ddbimporter = {
    id: data.id,
    data: data,
    version: CONFIG.DDBI.version,
  };

  if (data.moreDetailsUrl) {
    result.flags.ddbimporter['moreDetailsUrl'] = data.moreDetailsUrl;
  }

  result.system.source = DDBHelper.parseSource(data);

  return result;
}

export async function generateFeatureAdvancements(klass, compendiumClassFeatures, ignoreIds = []) {
  logger.debug(`Parsing ${klass.name} features for advancement`);
  const compendiumLabel = CompendiumHelper.getCompendiumLabel("features");

  let advancements = [];
  klass.classFeatures
    .filter((feature) => !ignoreIds.includes(feature.id))
    .forEach((feature) => {
      const featureMatch = compendiumClassFeatures.find((match) => {
        const matchName = hasProperty(match, "flags.ddbimporter.featureName")
          ? getProperty(match, "flags.ddbimporter.featureName").trim().toLowerCase()
          : match.name.trim().toLowerCase();
        return feature.name.trim().toLowerCase() == matchName
          && hasProperty(match, "flags.ddbimporter")
          && (match.flags.ddbimporter.class == klass.name
            || match.flags.ddbimporter.parentClassId == klass.id
            || match.flags.ddbimporter.classId == klass.id);
      });

      if (featureMatch) {
        const levelAdvancement = advancements.findIndex((advancement) => advancement.level === feature.requiredLevel);

        if (levelAdvancement == -1) {
          const advancement = {
            _id: foundry.utils.randomID(),
            type: "ItemGrant",
            configuration: {
              items: [
                `Compendium.${compendiumLabel}.${featureMatch._id}`
              ]
            },
            value: {},
            level: feature.requiredLevel,
            title: "Features",
            icon: "",
            classRestriction: ""
          };
          advancements.push(advancement);
        } else {
          advancements[levelAdvancement].configuration.items.push(`Compendium.${compendiumLabel}.${featureMatch._id}`);
        }
      }
    });

  return advancements;
}

export async function buildClassFeatures(klass, compendiumClassFeatures, ignoreIds = []) {
  logger.debug(`Parsing ${klass.name} features`);
  let description = "<h1>Class Features</h1>\n\n";
  let classFeatures = [];

  const compendiumLabel = CompendiumHelper.getCompendiumLabel("features");

  klass.classFeatures.forEach((feature) => {
    const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

    // sort by level?
    if (!classFeaturesAdded && !ignoreIds.includes(feature.id)) {
      const featureMatch = compendiumClassFeatures.find((match) => {
        const matchName = hasProperty(match, "flags.ddbimporter.featureName")
          ? getProperty(match, "flags.ddbimporter.featureName").trim().toLowerCase()
          : match.name.trim().toLowerCase();
        return feature.name.trim().toLowerCase() == matchName
          && hasProperty(match, "flags.ddbimporter")
          && (match.flags.ddbimporter.class == klass.name
            || match.flags.ddbimporter.parentClassId == klass.id
            || match.flags.ddbimporter.classId == klass.id);
      });
      const title = (featureMatch)
        ? `<p><b>@Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</b></p>`
        : `<p><b>${feature.name}</b></p>`;

      // eslint-disable-next-line require-atomic-updates
      description += `${title}\n${feature.description}\n\n`;
      classFeatures.push(feature.name);
    }
  });

  return description;
}

export function getClassFeature(feature, klass, subClassName = "") {
  logger.debug("Class feature build started");

  let result = buildBase(feature);
  result.flags.obsidian.source.text = klass.name;

  const duplicateFeature = FEATURE_DUP.includes(feature.name);
  result.name = (duplicateFeature) ? `${feature.name} (${klass.name})` : feature.name;

  result.flags.ddbimporter['featureId'] = feature.id;
  result.flags.ddbimporter['featureName'] = feature.name;
  result.flags.ddbimporter['requiredLevel'] = feature.requiredLevel;
  result.flags.ddbimporter['prerequisite'] = feature.prerequisite;
  result.flags.ddbimporter['class'] = klass.name;
  result.flags.ddbimporter['classId'] = klass.id;
  result.flags.ddbimporter['subClass'] = subClassName;
  result.flags.ddbimporter['parentClassId'] = klass.parentClassId;
  const requiredLevel = feature.requiredLevel ? ` ${feature.requiredLevel}` : "";
  result.system.requirements = `${klass.name}${requiredLevel}`;

  result.system.description.value = parseTags(result.system.description.value);

  return result;
}

export async function buildBaseClass(klass) {
  let result = buildBase(klass);
  logger.debug(`Parsing ${klass.name}`);
  result.flags.obsidian.source.text = klass.name;
  result.type = "class";
  result.system.identifier = utils.referenceNameString(klass.name).toLowerCase();
  result.system.advancement = [];

  let avatarUrl;
  let largeAvatarUrl;
  let portraitAvatarUrl;

  if (klass.portraitAvatarUrl) {
    const downloadOptions = { type: "class-portrait", name: klass.fullName };
    portraitAvatarUrl = await FileHelper.getImagePath(klass.portraitAvatarUrl, downloadOptions);
    result.img = portraitAvatarUrl;
    result.flags.ddbimporter['portraitAvatarUrl'] = klass.portraitAvatarUrl;
  }

  if (klass.avatarUrl) {
    const downloadOptions = { type: "class-avatar", name: klass.fullName };
    avatarUrl = await FileHelper.getImagePath(klass.avatarUrl, downloadOptions);
    result.flags.ddbimporter['avatarUrl'] = klass.avatarUrl;
    if (!result.img) {
      result.img = avatarUrl;
    }
  }

  if (klass.largeAvatarUrl) {
    const downloadOptions = { type: "class-large", name: klass.fullName };
    largeAvatarUrl = await FileHelper.getImagePath(klass.largeAvatarUrl, downloadOptions);
    // eslint-disable-next-line require-atomic-updates
    result.flags.ddbimporter['largeAvatarUrl'] = klass.largeAvatarUrl;
    if (!result.img) {
      // eslint-disable-next-line require-atomic-updates
      result.img = largeAvatarUrl;
    }
  }

  const image = (avatarUrl)
    ? `<img class="ddb-class-image" src="${avatarUrl}">\n\n`
    : `<img class="ddb-class-image" src="${largeAvatarUrl}">\n\n`;

  // eslint-disable-next-line require-atomic-updates
  result.system.description.value += image;

  // eslint-disable-next-line require-atomic-updates
  result.flags.ddbimporter['parentClassId'] = klass.parentClassId;
  // eslint-disable-next-line require-atomic-updates
  result.flags.ddbimporter['hitDice'] = klass.hitDice;
  // eslint-disable-next-line require-atomic-updates
  result.flags.ddbimporter['spellCastingAbilityId'] = klass.spellCastingAbilityId;
  // eslint-disable-next-line require-atomic-updates
  result.flags.ddbimporter['canCastSpells'] = klass.canCastSpells;

  // setup data
  // eslint-disable-next-line require-atomic-updates
  result.system.levels = 1;
  // eslint-disable-next-line require-atomic-updates
  result.system.hitDice = `d${klass.hitDice}`;

  let spellcasting = {};
  if (klass.canCastSpells) {
    const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name == klass.name);
    const spellCastingAbility = klass.spellCastingAbilityId
      ? DICTIONARY.character.abilities.find((a) => a.id == klass.spellCastingAbilityId).value
      : null;
    if (spellProgression) {
      spellcasting = {
        progression: spellProgression.value,
        ability: spellCastingAbility,
      };
    }
  }
  // eslint-disable-next-line require-atomic-updates
  result.system.spellcasting = spellcasting;

  // this can be used with the add class response
  // const classSkillSubType = `choose-a-${klass.name.toLowerCase()}-skill`;
  // const skillCount = .filter((mod) => mod.subType === classSkillSubType && mod.type === "proficiency"));

  const proficiencyOption = klass.classFeatures.find((feature) =>
    feature.name === "Proficiencies"
    && feature.requiredLevel === 1
  );

  let dom = new DocumentFragment();
  $.parseHTML(proficiencyOption.description).forEach((element) => {
    dom.appendChild(element);
  });

  // Choose any three
  // Skills: Choose two from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, and Survival
  const skillText = dom.textContent.toLowerCase().split("skills:").pop().split("\n")[0].split("The")[0].split(".")[0].trim();
  const allSkillRegex = /Skills: Choose any (\w+)(.*)($|\.$|\w+:)/im;
  const allMatch = dom.textContent.match(allSkillRegex);
  const skillRegex = /choose (\w+)(?:\sskills)* from (.*)($|The|\.$|\w+:)/im;
  const skillMatch = skillText.match(skillRegex);

  if (allMatch) {
    const skills = DICTIONARY.character.skills.map((skill) => skill.name);
    const numberSkills = DICTIONARY.numbers.find((num) => allMatch[1].toLowerCase() === num.natural);
    // eslint-disable-next-line require-atomic-updates
    result.system.skills = {
      number: numberSkills ? numberSkills.num : 2,
      choices: skills,
      value: [],
    };
  } else if (skillMatch) {
    const skillNames = skillMatch[2].replace('and', ',').split(',').map((skill) => skill.trim());
    const skills = skillNames.filter((name) => DICTIONARY.character.skills.some((skill) => skill.label.toLowerCase() === name.toLowerCase()))
      .map((name) => {
        const dictSkill = DICTIONARY.character.skills.find((skill) => skill.label.toLowerCase() === name.toLowerCase());
        return dictSkill.name;
      });
    const numberSkills = DICTIONARY.numbers.find((num) => skillMatch[1].toLowerCase() === num.natural);
    // eslint-disable-next-line require-atomic-updates
    result.system.skills = {
      number: numberSkills ? numberSkills.num : 2,
      choices: skills,
      value: [],
    };
  }

  // get class saves
  const savingText = dom.textContent.toLowerCase().split("saving throws:").pop().split("\n")[0].split("The")[0].split(".")[0].split("skills:")[0].trim();
  const saveRegex = /(.*)(?:$|The|\.$|\w+:)/im;
  const saveMatch = savingText.match(saveRegex);

  if (saveMatch) {
    const saveNames = saveMatch[1].replace('and', ',').split(',').map((ab) => ab.trim());
    const saves = saveNames
      .filter((name) => DICTIONARY.character.abilities.some((ab) => ab.long.toLowerCase() === name.toLowerCase()))
      .map((name) => {
        const dictAbility = DICTIONARY.character.abilities.find((ab) => ab.long.toLowerCase() === name.toLowerCase());
        return dictAbility.value;
      });
    // eslint-disable-next-line require-atomic-updates
    result.system.saves = saves;
  }

  // "moreDetailsUrl": "/characters/classes/rogue",

  if (klass.equipmentDescription) {
    // eslint-disable-next-line require-atomic-updates
    result.system.description.value += `<p><b>Starting Equipment</b></p>\n${klass.equipmentDescription}\n\n`;
  }

  return result;
}
