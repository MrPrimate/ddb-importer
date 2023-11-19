import logger from '../../logger.js';
import DICTIONARY from '../../dictionary.js';
import utils from '../../lib/utils.js';
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from '../../lib/CompendiumHelper.js';
import { getClassFeatures } from './index.js';


export default class ClassAdvancementHelper {


  static async addSRDAdvancements(advancements, klass) {
    const rulesCompendium = "dnd5e.classes";
    const srdCompendium = CompendiumHelper.getCompendium(rulesCompendium);
    await srdCompendium.getIndex();
    const klassMatch = srdCompendium.index.find((k) => k.name === klass.name);
    if (klassMatch) {
      const srdKlass = await srdCompendium.getDocument(klassMatch._id);
      const scaleAdvancements = srdKlass.system.advancement.filter((srdA) =>
        srdA.type === "ScaleValue"
        && !advancements.some((ddbA) => ddbA.configuration.identifier === srdA.configuration.identifier)
      ).map((advancement) => {
        return foundry.utils.isNewerVersion(game.system.version, "2.0.3") ? advancement.toObject() : advancement;
      });
      advancements.push(...scaleAdvancements);
    }

    return advancements;
  }

  static getHPAdvancement(klass, character) {
    // const value = "value": {
    //   "1": "max",
    //   "2": "avg"
    // },
    const value = {};
    if (klass) {
      const rolledHP = getProperty(character, "flags.ddbimporter.rolledHP") ?? false;
      const startingClass = getProperty(klass, "flags.ddbimporter.isStartingClass") === true;
      const useMaxHP = game.settings.get("ddb-importer", "character-update-policy-use-hp-max-for-rolled-hp");
      if (rolledHP && !useMaxHP) {
        const baseHP = getProperty(character, "flags.ddbimporter.baseHitPoints");
        const totalLevels = getProperty(character, "flags.ddbimporter.dndbeyond.totalLevels");
        const hpPerLevel = Math.floor(baseHP / totalLevels);
        const leftOvers = Math.floor(baseHP % totalLevels);

        for (let i = 1; i <= klass.system.levels; i++) {
          value[`${i}`] = i === 1 && startingClass ? (hpPerLevel + leftOvers) : hpPerLevel;
        }
      } else {
        for (let i = 1; i <= klass.system.levels; i++) {
          value[`${i}`] = i === 1 && startingClass ? "max" : "avg";
        }
      };
    }
    return {
      _id: foundry.utils.randomID(),
      type: "HitPoints",
      configuration: {},
      value,
      title: "",
      icon: "",
      classRestriction: "",
    };
  }


  static generateSkillAdvancements(ddb, klass, ddbKlass, isSubclass = false) {
    // There class object supports skills granted by the class.
    // Lets find and add them for future compatibility.
    // const classFeatureIds = ddbKlass.definition.classFeatures
    //   .map((feature) => feature.id)
    //   .concat((ddbKlass.subclassDefinition)
    //     ? ddbKlass.subclassDefinition.classFeatures.map((feature) => feature.id)
    //     : []);

    const classProficiencyFeatureIds = ddbKlass.definition.classFeatures
      .filter((feature) => feature.name === "Proficiencies")
      .map((feature) => feature.id)
      .concat((ddbKlass.subclassDefinition)
        ? ddbKlass.subclassDefinition.classFeatures
          .filter((feature) => feature.name === "Proficiencies")
          .map((feature) => feature.id)
        : []);

    // const classSkillSubType = `choose-a-${ddbKlass.definition.name.toLowerCase()}-skill`;
    // const skillIds = DDBHelper.getChosenClassModifiers(ddb)
    //   .filter((mod) => mod.subType === classSkillSubType && mod.type === "proficiency")
    //   .map((mod) => mod.componentId);

    // "subType": 1,
    // "type": 2,

    // There class object supports skills granted by the class.
    const skillsChosen = new Set();
    const skillChoices = new Set();
    const choiceDefinitions = ddb.character.choices.choiceDefinitions;
    ddb.character.choices.class.filter((choice) =>
      classProficiencyFeatureIds.includes(choice.componentId)
      && choice.subType === 1
      && choice.type === 2
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.character.skills.find((skill) => skill.label === option.label);
      skillsChosen.add(smallChosen.name);
      const optionNames = optionChoice.options.filter((option) =>
        DICTIONARY.character.skills.some((skill) => skill.label === option.label)
        && choice.optionIds.includes(option.id)
      ).map((option) =>
        DICTIONARY.character.skills.find((skill) => skill.label === option.label).name
      );

      optionNames.forEach((skill) => skillChoices.add(skill));
    });

    klass.system.skills = {
      value: Array.from(skillsChosen),
      number: skillsChosen.size,
      choices: Array.from(skillChoices),
    };

    const updates = [];
    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
    advancement.updateSource({ classRestriction: "primary", configuration: { grants: updates } });

    return [advancement.toObject()];
  }

  static generateSaveAdvancements(ddb, klassDefinition) {
    if (foundry.utils.isNewerVersion("2.4.0", game.system.version)) return [];
    const advancements = [];
    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        const modFilters = {
          includeExcludedEffects: true,
          classId: klassDefinition.id,
          exactLevel: i,
          availableToMulticlass,
        };
        const mods = DDBHelper.getChosenClassModifiers(ddb, modFilters);
        const updates = DICTIONARY.character.abilities
          .filter((ability) => {
            // return DDBHelper.filterModifiers(mods, "proficiency", { subType: `${ability.long}-saving-throws` }).length > 0;
            const modsSum = DDBHelper.filterModifiers(mods, "proficiency", { subType: `${ability.long}-saving-throws` }).length > 0;
            // console.warn("modsSum", { ability, modsSum });
            return modsSum;
          })
          .map((ability) => `saves:${ability.value}`);
        // create a leveled advancement
        if (updates.length > 0) {
          const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
          const update = {
            classRestriction: availableToMulticlass ? "" : "primary",
            configuration: { grants: updates },
            level: i,
            value: {
              chosen: updates,
            },
          };
          advancement.updateSource(update);
          advancements.push(advancement.toObject());
        }
      });
    }


    return advancements;
  }

  static generateScaleValueAdvancement(feature) {
    // distance, number, dice, anything
    let type = "string";
    const die = feature.levelScales[0]?.dice ? feature.levelScales[0]?.dice : feature.levelScales[0]?.die ? feature.levelScales[0]?.die : undefined;

    if (die?.diceString && (!die.fixedValue || die.fixedValue === "")) {
      type = "dice";
    } else if (feature.levelScales[0].fixedValue
      && feature.levelScales[0].fixedValue !== ""
      && Number.isInteger(feature.levelScales[0].fixedValue)
    ) {
      type = "number";
    }

    const scaleValue = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: utils.referenceNameString(feature.name).toLowerCase(),
        type,
        scale: {},
      },
      value: {},
      title: feature.name,
      icon: "",
      // classRestriction: "",
    };

    feature.levelScales.forEach((scale) => {
      const die = scale.dice ? scale.dice : scale.die ? scale.die : undefined;
      if (type === "dice") {
        scaleValue.configuration.scale[scale.level] = {
          n: die.diceCount,
          die: die.diceValue,
        };
      } else if (type === "number") {
        scaleValue.configuration.scale[scale.level] = {
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
        scaleValue.configuration.scale[scale.level] = {
          value,
        };
      }
    });

    return scaleValue;
  }


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
    const scaleValue = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: `${advancement.configuration.identifier}-uses`,
        type: "number",
        scale: {},
      },
      value: {},
      title: `${advancement.title} (Uses)`,
      icon: "",
    };

    for (const [key, value] of Object.entries(advancement.configuration.scale)) {
      scaleValue.configuration.scale[key] = {
        value: value.n,
      };
    }

    return scaleValue;
  }

  static addSingularDie(advancement) {
    const scaleValue = ClassAdvancementHelper.convertToSingularDie(duplicate(advancement));

    scaleValue._id = foundry.utils.randomID();
    scaleValue.configuration.identifier = `${advancement.configuration.identifier}-die`;

    return scaleValue;
  }

  static SPECIAL_ADVANCEMENTS = {
    "Combat Superiority": {
      fix: true,
      fixFunction: ClassAdvancementHelper.renameTotal,
      additionalAdvancements: true,
      additionalFunctions: [ClassAdvancementHelper.addAdditionalUses, ClassAdvancementHelper.addSingularDie],
    },
    "Rune Carver": {
      fix: true,
      fixFunction: ClassAdvancementHelper.renameTotal,
      additionalAdvancements: false,
      additionalFunctions: [],
    },
  };

  static classFixes(klass) {
    if (klass.name.startsWith("Order of the Profane Soul")) {
      klass.name = "Order of the Profane Soul";
      const slotsScaleValue = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `pact-slots`,
          type: "number",
          scale: {
            3: {
              value: 1,
            },
            6: {
              value: 2,
            },
          },
        },
        value: {},
        title: `Pact Slots`,
        icon: null,
      };

      const levelScaleValue = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `pact-level`,
          type: "number",
          scale: {
            3: {
              value: 1,
            },
            7: {
              value: 2,
            },
            13: {
              value: 3,
            },
          },
        },
        value: {},
        title: `Pact Level`,
        icon: null,
      };

      klass.system.advancement.push(slotsScaleValue, levelScaleValue);
    }
    return klass;
  }


}
