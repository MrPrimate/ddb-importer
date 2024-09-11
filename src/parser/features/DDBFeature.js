import DICTIONARY from "../../dictionary.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import AdvancementHelper from "../advancements/AdvancementHelper.js";
import DDBAttackAction from "./DDBAttackAction.js";
import DDBBaseFeature from "./DDBBaseFeature.js";


export default class DDBFeature extends DDBBaseFeature {

  static DOC_TYPE = {
    class: "feat", // class feature
    subclass: "feat", // subclass feature
    race: "feat",
    background: "background",
    feat: "feat",
  };

  _init() {
    this.documentType = DDBFeature.DOC_TYPE[this.type];
    this.tagType = this.type;
    logger.debug(`Generating Feature ${this.ddbDefinition.name}`);
    this._class = this.noMods
      ? null
      : this.ddbData.character.classes.find((klass) =>
        (this.ddbDefinition.classId
          && (klass.definition.id === this.ddbDefinition.classId || klass.subclassDefinition?.id === this.ddbDefinition.classId))
        || (this.ddbDefinition.className && klass.definition.name === this.ddbDefinition.className
          && ((!this.ddbDefinition.subclassName || this.ddbDefinition.subclassName === "")
            || (this.ddbDefinition.subclassName && klass.subclassDefinition?.name === this.ddbDefinition.subclassName))
        ),
      );
    this._choices = this.noMods
      ? []
      : DDBHelper.getChoices(this.ddbData, this.type, this.ddbDefinition, false).reduce((p, c) => {
        if (!p.some((e) => e.id === c.id)) p.push(c);
        return p;
      }, []);
    this._chosen = this.noMods ? [] : DDBHelper.getChoices(this.ddbData, this.type, this.ddbDefinition, true);
    this.isChoiceFeature = this._choices.length > 0;
    this.include = !this.isChoiceFeature;
    this.hasRequiredLevel = !this._class || (this._class && this._class.level >= this.ddbDefinition.requiredLevel);

    this.advancementHelper = new AdvancementHelper({
      ddbData: this.ddbData,
      type: this.type,
      noMods: this.noMods,
    });
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: utils.nameString(this.ddbDefinition.name),
      type: this.documentType,
      effects: [],
      system: utils.getTemplate(this.documentType),
      flags: {
        ddbimporter: {
          id: this.ddbDefinition.id,
          type: this.tagType,
          entityTypeId: this.ddbDefinition.entityTypeId,
          dndbeyond: {
            requiredLevel: this.ddbDefinition.requiredLevel,
            displayOrder: this.ddbDefinition.displayOrder,
            featureType: this.ddbDefinition.featureType,
            classId: this.ddbDefinition.classId,
            entityId: this.ddbDefinition.entityId,
            entityRaceId: this.ddbDefinition.entityRaceId,
            entityType: this.ddbDefinition.entityType,
          },
        },
        obsidian: {
          source: {
            type: this.tagType,
          },
        },
      },
    };

    const requiredLevel = foundry.utils.getProperty(this.ddbDefinition, "requiredLevel");
    if (Number.isInteger(Number.parseInt(requiredLevel))) {
      this.data.system.prerequisites = {
        level: Number.parseInt(requiredLevel),
      };
    }

    this.data.system.identifier = this.identifier;
  }

  // eslint-disable-next-line class-methods-use-this
  _prepare() {
    // override this feature
  }

  _buildNatural() {
    const override = {
      name: this.data.name,
      description: this.ddbDefinition.description,
      snippet: this.ddbDefinition.snippet,
      id: this.ddbDefinition.id,
      entityTypeId: this.ddbDefinition.entityTypeId,
      componentId: this.ddbDefinition.componentId,
      componentTypeId: this.ddbDefinition.componentTypeId,
    };

    const unarmedStrikeMock = foundry.utils.deepClone(CONFIG.DDB.naturalActions[0]);
    unarmedStrikeMock.displayAsAttack = true;
    const strikeMock = Object.assign(unarmedStrikeMock, override);

    logger.debug(`Building Natural Attack for ${this.data.name}`);
    const ddbAttackAction = new DDBAttackAction({
      ddbData: this.ddbData,
      ddbDefinition: strikeMock,
      rawCharacter: this.rawCharacter,
      type: this.type,
      documentType: "weapon",
    });
    ddbAttackAction.naturalWeapon = true;
    ddbAttackAction.build();

    this.data = ddbAttackAction.data;
  }

  _buildBasic() {
    this._generateSystemType();
    this._generateSystemSubType();

    // this._generateLimitedUse();
    // this._generateRange();

    this._generateActivity({ hintsOnly: true });
    this.enricher.addAdditionalActivities(this);

    // this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);

    this._generateDescription({ forceFull: true });
    this._addEffects(undefined, this.type);

    // this._generateFlagHints();
    // this._generateResourceFlags();
    // this._addCustomValues();

    this.enricher.addDocumentOverride();
  }

  async _generateFeatureAdvancements() {
    // STUB
    logger.info(`Generating feature advancements for ${this.ddbDefinition.name} are not yet supported`);
  }

  _addAdvancement(advancement) {
    if (!advancement) return;
    const advancementData = advancement.toObject();
    if (
      advancementData.configuration.choices.length !== 0
      || advancementData.configuration.grants.length !== 0
      || (advancementData.value && Object.keys(advancementData.value).length !== 0)
    ) {
      // console.warn(advancementData)
      // console.warn("ADVANCEMENT", {
      //   advancement,
      //   advancementData,
      //   choicebool: advancementData.configuration.choices.length !== 0,
      //   grantbool: advancementData.configuration.grants.length !== 0,
      //   valuebool: (advancementData.value && Object.keys(advancementData.value).length !== 0),
      // });
      this.data.system.advancement.push(advancementData);
    }
  }


  generateBackgroundAbilityScoreAdvancement() {
    const advancements = [];

    console.warn(`ABILITY SCORE ADVANCEMENT NOT IMPLEMENTED`, {
      this: this,
    });

    // this.ddbDefinition.grantedFeats

  //   [
  //     {
  //         "id": 16335,
  //         "name": "Lucky",
  //         "featIds": [
  //             1789160
  //         ]
  //     },
  //     {
  //         "id": 16336,
  //         "name": "Ability Scores",
  //         "featIds": [
  //             1789210
  //         ]
  //     }
  // ]

  // feats:[]
//   {
//     "componentTypeId": 67468084,
//     "componentId": 16336,
//     "definition": {
//         "id": 1789210,
//         "entityTypeId": 1088085227,
//         "definitionKey": "1088085227:1789210",
//         "name": "Wayfarer Ability Score Improvements",
//         "description": "<p>The Wayfarer Background allows you to choose between Dexterity, Wisdom, and Charisma. Increase one of these scores by 2 and another one by 1, or increase all three by 1. None of these increases can raise a score above 20.</p>",
//         "snippet": "",
//         "activation": {
//             "activationTime": null,
//             "activationType": null
//         },
//         "sourceId": null,
//         "sourcePageNumber": null,
//         "creatureRules": [],
//         "prerequisites": [],
//         "isHomebrew": false,
//         "sources": [
//             {
//                 "sourceId": 145,
//                 "pageNumber": 185,
//                 "sourceType": 1
//             }
//         ],
//         "spellListIds": [],
//         "isRepeatable": false,
//         "repeatableParentId": null,
//         "categories": [
//             {
//                 "id": 491,
//                 "entityTypeId": 1088085227,
//                 "entityId": 1789210,
//                 "definitionKey": "1088085227:1789210",
//                 "entityTagId": 2,
//                 "tagName": "__INITIAL_ASI"
//             },
//             {
//                 "id": 490,
//                 "entityTypeId": 1088085227,
//                 "entityId": 1789210,
//                 "definitionKey": "1088085227:1789210",
//                 "entityTagId": 3,
//                 "tagName": "__DISPLAY_WITH_DATA_ORIGIN"
//             }
//         ]
//     },
//     "definitionId": 0
// }

// modifiers.feats: []

// {
//   "fixedValue": 1,
//   "id": "62627298",
//   "entityId": 1,
//   "entityTypeId": 1472902489,
//   "type": "bonus",
//   "subType": "strength-score",
//   "dice": null,
//   "restriction": "",
//   "statId": null,
//   "requiresAttunement": false,
//   "duration": null,
//   "friendlyTypeName": "Bonus",
//   "friendlySubtypeName": "Strength Score",
//   "isGranted": false,
//   "bonusTypes": [],
//   "value": 1,
//   "availableToMulticlass": true,
//   "modifierTypeId": 1,
//   "modifierSubTypeId": 2,
//   "componentId": 1789093,
//   "componentTypeId": 1088085227,
//   "tagConstraints": []
// }

    const grantedFeatIds = this.ddbDefinition.grantedFeats


    // get list of feats from background
    // get feat ids from feats[]
    // find boosts granted by modifier in modifiers

    // for (let i = 0; i <= 20; i++) {
    //   const abilityAdvancementFeature = this.classFeatures.find((f) => f.name.includes("Ability Score Improvement") && f.requiredLevel === i);

    //   // eslint-disable-next-line no-continue
    //   if (!abilityAdvancementFeature) continue;
    //   const advancement = new game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement();
    //   advancement.updateSource({ configuration: { points: 2 }, level: i, value: { type: "asi" } });

    //   // if advancement has taken ability improvements
    //   const modFilters = {
    //     includeExcludedEffects: true,
    //     classId: this.ddbClassDefinition.id,
    //     exactLevel: i,
    //     useUnfilteredModifiers: true,
    //   };
    //   const mods = DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);

    //   const assignments = {};
    //   DICTIONARY.character.abilities.forEach((ability) => {
    //     const count = DDBHelper.filterModifiers(mods, "bonus", { subType: `${ability.long}-score` }).length;
    //     if (count > 0) assignments[ability.value] = count;
    //   });

    //   // create a leveled advancement
    //   if (Object.keys(assignments).length > 0) {
    //     advancement.updateSource({
    //       value: {
    //         assignments,
    //       },
    //     });
    //   } else if (abilityAdvancementFeature.requiredLevel <= this.ddbClass.level) {
    //     // feat id selection happens later once features have been generated
    //     // "type": "feat",
    //     // "feat": {
    //     //   "vu8kJ2iTCEiGQ1mv": "Compendium.world.ddb-test2-ddb-feats.Item.3mfeQMT6Fh1VRubU"
    //     // }
    //     advancement.updateSource({
    //       value: {
    //         type: "feat",
    //         feat: {
    //         },
    //       },
    //     });
    //     // abilityAdvancementFeature.id: 313
    //     // abilityAdvancementFeature.entityTypeId: 12168134
    //     const featChoice = this.ddbData.character.feats.find((f) =>
    //       f.componentId == abilityAdvancementFeature.id
    //       && f.componentTypeId == abilityAdvancementFeature.entityTypeId,
    //     );
    //     const featureMatch = featChoice ? this.getFeatCompendiumMatch(featChoice.definition.name) : null;
    //     if (featureMatch) {
    //       this._advancementMatches.features[advancement._id] = {};
    //       this._advancementMatches.features[advancement._id][featureMatch.name] = featureMatch.uuid;
    //     } else {
    //       logger.info("Missing asi feat linking match for", { abilityAdvancementFeature, featChoice, this: this });
    //     }

    //   }

    //   advancements.push(advancement.toObject());
    // }

    // this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateSkillAdvancements() {
    const mods = this.advancementHelper.noMods
      ? []
      : DDBHelper.getModifiers(this.ddbData, this.type);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.character.skills.map((s) => s.subType).includes(mod.subType),
    );
    const advancement = this.advancementHelper.getSkillAdvancement(skillExplicitMods, this.ddbDefinition, undefined, 0);
    this._addAdvancement(advancement);
  }

  _generateLanguageAdvancements() {
    const mods = this.advancementHelper.noMods
      ? []
      : DDBHelper.getModifiers(this.ddbData, this.type);

    const advancement = this.advancementHelper.getLanguageAdvancement(mods, this.ddbDefinition, 0);
    this._addAdvancement(advancement);
  }

  _generateToolAdvancements() {
    const mods = this.advancementHelper.noMods
      ? []
      : DDBHelper.getModifiers(this.ddbData, this.type);
    const advancement = this.advancementHelper.getToolAdvancement(mods, this.ddbDefinition, 0);
    this._addAdvancement(advancement);
  }

  _generateSkillOrLanguageAdvancements() {
    // STUB
    logger.info(`Generating skill or language advancements for ${this.ddbDefinition.name} are not yet supported`);
  }

  async generateAdvancements() {
    await this._generateFeatureAdvancements();
    this._generateSkillAdvancements();
    this._generateLanguageAdvancements();
    this._generateToolAdvancements();
    // FUTURE: Equipment?  needs better handling in Foundry
    this._generateSkillOrLanguageAdvancements();
  }

  async buildBackgroundFeatAdvancements(extraFeatIds = []) {
    const characterFeatIds = foundry.utils.getProperty(this.ddbData, "character.background.definition.featList.featIds") ?? [];
    const featIds = extraFeatIds.concat(characterFeatIds);
    if (featIds.length === 0) return;

    const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
    const indexFilter = {
      fields: [
        "name",
        "flags.ddbimporter.featId",
      ],
    };
    const compendium = CompendiumHelper.getCompendiumType("feats");
    await compendium.getIndex(indexFilter);

    const feats = compendium.index.filter((f) => featIds.includes(foundry.utils.getProperty(f, "flags.ddbimporter.featId")));

    advancement.updateSource({
      configuration: {
        items: feats.map((f) => {
          return { uuid: f.uuid };
        }),
      },
      title: "Feat",
    });
    this.data.system.advancement.push(advancement.toObject());

    const advancementLinkData = foundry.utils.getProperty(this.data, "flags.ddbimporter.advancementLink") ?? [];
    const advancementData = {
      _id: advancement._id,
      features: {},
    };
    advancementData[advancement._id] = {};
    feats.forEach((f) => {
      advancementData.features[f.name] = f.uuid;
    });
    advancementLinkData.push(advancementData);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.advancementLink", advancementLinkData);
  }

  _buildBackground() {
    try {
      this._generateSystemType();
      this._generateSystemSubType();

      // this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);

      logger.debug(`Found background ${this.ddbDefinition.name}`);
      logger.debug(`Found ${this._choices.map((c) => c.label).join(",")}`);

      this._generateDescription({ forceFull: true });
      this.data.system.description.value += `<h3>Proficiencies</h3><ul>`;
      this._choices.forEach((choice) => {
        this._addEffects(choice, this.type);
        this.data.system.description.value += `<li>${choice.label}</li>`;
      });
      this.data.system.description.value += `</ul>`;
      this.data.img = "icons/skills/trades/academics-book-study-purple.webp";
      this.data.name = this.data.name.split("Background: ").pop();

      this.enricher.addDocumentOverride();

    } catch (err) {
      logger.warn(
        `Unable to Generate Background Feature: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

  _buildChoiceFeature() {
    this._generateSystemType();
    this._generateSystemSubType();

    // this._generateLimitedUse();
    // this._generateRange();

    const choiceText = this._choices.reduce((p, c) => {
      if (c.description) {
        return `${p}<br>
        <h3>${c.label}</h3>
        <p>${c.description}</p>`;
      } else {
        return `${p}<br>
        <p>${c.label}</p>`;
      }
    }, "");
    // this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);

    // console.warn("CHOICE TEXT", {
    //   choices: this._choices,
    //   choiceText,
    // });

    this._generateDescription({ extra: `<section class="secret">${choiceText}</section>` });
    this._addEffects(undefined, this.type);

    // this._generateFlagHints();
    // this._generateResourceFlags();
    // this._addCustomValues();

    this.enricher.addDocumentOverride();
  }


  build() {
    try {
      if (this.naturalWeapon) {
        this._buildNatural();
      } else if (this.type === "background") {
        // work around till background parsing support advancements
        this.isChoiceFeature = false;
        this._buildBackground();
      } else if (this.isChoiceFeature) {
        logger.debug(`${this.name} has multiple choices and you need to pass this instance to DDBChoiceFeature`);
        this._buildChoiceFeature();
      } else {
        this._buildBasic();
      }
    } catch (err) {
      logger.warn(
        `Unable to Generate Basic Feature: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

}
