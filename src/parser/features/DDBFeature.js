import { DICTIONARY } from "../../config/_module.mjs";
import { utils, logger, CompendiumHelper } from "../../lib/_module.mjs";
import AdvancementHelper from "../advancements/AdvancementHelper.js";
import { DDBModifiers, DDBDataUtils, SystemHelpers } from "../lib/_module.mjs";
import DDBAttackAction from "./DDBAttackAction.js";
import DDBFeatureMixin from "./DDBFeatureMixin.js";

export default class DDBFeature extends DDBFeatureMixin {

  static DOC_TYPE = {
    class: "feat", // class feature
    subclass: "feat", // subclass feature
    race: "feat",
    background: "background",
    feat: "feat",
  };

  static LEVEL_SCALE_EXCLUSION_USES = [
    "Destroy Undead",
    "Magical Cunning",
    "Brutal Strike",
    "Extra Attack",
    "Improved Critical",
    "Unarmored Movement",
    "Metamagic",
  ];

  static LEVEL_SCALE_EXCLUSION_USES_STARTS_WITH = [
    "Aura of ",
  ];


  _init() {
    this.documentType = DDBFeature.DOC_TYPE[this.type];
    this.tagType = this.type;
    logger.debug(`Init Feature ${this.ddbDefinition.name}`);
    this._class = this.isGeneric
      ? null
      : this.ddbData.character.classes.find((klass) =>
        (this.ddbDefinition.classId
          && (klass.definition.id === this.ddbDefinition.classId || klass.subclassDefinition?.id === this.ddbDefinition.classId))
        || (this.ddbDefinition.className && klass.definition.name === this.ddbDefinition.className
          && ((!this.ddbDefinition.subclassName || this.ddbDefinition.subclassName === "")
            || (this.ddbDefinition.subclassName && klass.subclassDefinition?.name === this.ddbDefinition.subclassName))
        ),
      );
    this._choices = this.isGeneric
      ? []
      : DDBDataUtils.getChoices({
        ddb: this.ddbData,
        type: this.type,
        feat: this.ddbDefinition,
        selectionOnly: false,
      }).reduce((p, c) => {
        if (c.parentChoiceId !== null) return p;
        if (!p.some((e) => e.id === c.id)) p.push(c);
        return p;
      }, []);
    this._chosen = this.isGeneric
      ? []
      : DDBDataUtils.getChoices({
        ddb: this.ddbData,
        type: this.type,
        feat: this.ddbDefinition,
        selectionOnly: true,
      });
    this._parentOnlyChoices = DDBDataUtils.getChoices({
      ddb: this.ddbData,
      type: this.type,
      feat: this.ddbDefinition,
      selectionOnly: false,
      filterByParentChoice: true,
    });
    this._parentOnlyChosen = DDBDataUtils.getChoices({
      ddb: this.ddbData,
      type: this.type,
      feat: this.ddbDefinition,
      selectionOnly: true,
      filterByParentChoice: true,
    });
    this.isChoiceFeature = this._choices.length > 0;
    this.include = !this.isChoiceFeature;
    this.hasRequiredLevel = !this._class || (this._class && this._class.level >= this.ddbDefinition.requiredLevel);

    this.advancementHelper = new AdvancementHelper({
      ddbData: this.ddbData,
      type: this.type,
      noMods: this.isGeneric,
    });
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: utils.nameString(this.ddbDefinition.name),
      type: this.documentType,
      effects: [],
      system: SystemHelpers.getTemplate(this.documentType),
      flags: {
        ddbimporter: {
          id: this.ddbDefinition.id,
          type: this.tagType,
          entityTypeId: this.ddbDefinition.entityTypeId,
          is2014: this.is2014,
          is2024: !this.is2014,
          componentId: this.ddbDefinition.componentId,
          componentTypeId: this.ddbDefinition.componentTypeId,
          originalName: this.originalName,
          dndbeyond: {
            requiredLevel: this.ddbDefinition.requiredLevel,
            displayOrder: this.ddbDefinition.displayOrder,
            featureType: this.ddbDefinition.featureType,
            class: this.ddbDefinition.className,
            classId: this.ddbDefinition.classId,
            entityId: this.ddbDefinition.entityId,
            entityRaceId: this.ddbDefinition.entityRaceId,
            entityType: this.ddbDefinition.entityType,
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
    this._generateActionTypes();
    this._generateFlagHints();

    this.excludedScaleUses = DDBFeature.LEVEL_SCALE_EXCLUSION_USES.includes(this.ddbDefinition.name)
      || DDBFeature.LEVEL_SCALE_EXCLUSION_USES.includes(this.data.name)
      || DDBFeature.LEVEL_SCALE_EXCLUSION_USES_STARTS_WITH.some((f) => this.originalName.startsWith(f));

    this.scaleValueUsesLink = DDBDataUtils.getScaleValueLink(this.ddbData, this.ddbFeature, true);

    this.useUsesScaleValueLink = !this.excludedScaleUses
      && this.scaleValueUsesLink
      && this.scaleValueUsesLink !== ""
      && this.scaleValueUsesLink !== "{{scalevalue-unknown}}";
  }

  async _buildNatural() {
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
    await ddbAttackAction.loadEnricher();
    await ddbAttackAction.build();

    this.data = ddbAttackAction.data;
  }

  async _buildBasic() {
    this._generateSystemType();
    this._generateSystemSubType();
    this._generateLimitedUse();

    this._generateActivity({ hintsOnly: true });
    await this.enricher.addAdditionalActivities(this);

    this._generateDescription({ forceFull: true });
    await this._addEffects(undefined, this.type);

    this.cleanup();
    this.enricher.addDocumentOverride();
    this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);
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

    const feats = this.ddbData.character.feats.filter((f) => {
      return (this.ddbDefinition.grantedFeats ?? []).some((backgroundFeat) => {
        if (f.componentId !== backgroundFeat.id) return false;
        if (!backgroundFeat.featIds.includes(f.definition.id)) return false;
        if (!f.definition.categories.some((c) => c.tagName === "__INITIAL_ASI")) return false;
        return true;
      });
    });

    // feats:[]
    //   {
    //     "componentTypeId": 67468084,
    //     "componentId": 16336,
    //     "definition": {
    //         "id": 1789210,
    //         "entityTypeId": 1088085227,
    //         "definitionKey": "1088085227:1789210",
    //         "name": "Wayfarer Ability Score Improvements",
    //
    //         "categories": [
    //             {
    //                 "id": 491,
    //                 "entityTypeId": 1088085227,
    //                 "entityId": 1789210,
    //                 "definitionKey": "1088085227:1789210",
    //                 "entityTagId": 2,
    //                 "tagName": "__INITIAL_ASI"
    //             },
    //         ]
    //     },
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

    const modifiers = this.ddbData.character.modifiers.feat.filter((m) =>
      feats.some((f) => m.componentTypeId == f.definition.entityTypeId),
    );

    if (modifiers.length === 0) return;

    // KNOWN_ISSUE_4_0: revist this to use the race/species advancement detection.
    const advancement = new game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement();
    advancement.updateSource({ configuration: { points: 3 }, level: 0, value: { type: "asi" } });

    const assignments = {};
    DICTIONARY.actor.abilities.forEach((ability) => {
      const count = DDBModifiers.filterModifiers(modifiers, "bonus", { subType: `${ability.long}-score` }).length;
      if (count > 0) assignments[ability.value] = count;
    });

    advancement.updateSource({
      value: {
        assignments,
      },
    });
    advancements.push(advancement.toObject());

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateSkillAdvancements() {
    const mods = this.advancementHelper.noMods
      ? []
      : DDBModifiers.getModifiers(this.ddbData, this.type);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.actor.skills.map((s) => s.subType).includes(mod.subType),
    );
    const advancement = this.advancementHelper.getSkillAdvancement(skillExplicitMods, this.ddbDefinition, undefined, 0);
    this._addAdvancement(advancement);
  }

  _generateLanguageAdvancements() {
    const mods = this.advancementHelper.noMods
      ? []
      : DDBModifiers.getModifiers(this.ddbData, this.type);

    const advancement = this.advancementHelper.getLanguageAdvancement(mods, this.ddbDefinition, 0);
    this._addAdvancement(advancement);
  }

  _generateToolAdvancements() {
    const mods = this.advancementHelper.noMods
      ? []
      : DDBModifiers.getModifiers(this.ddbData, this.type);
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
    const compendium = CompendiumHelper.getCompendiumType("feats", false);
    if (compendium) await compendium.getIndex(indexFilter);

    const feats = compendium
      ? compendium.index.filter((f) => featIds.includes(foundry.utils.getProperty(f, "flags.ddbimporter.featId")))
      : [];

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

  async _buildBackground() {
    try {
      this._generateSystemType();
      this._generateSystemSubType();

      logger.debug(`Found background ${this.ddbDefinition.name}`);
      logger.debug(`Found ${this._choices.map((c) => c.label).join(",")}`);

      this._generateDescription({ forceFull: true });
      this.data.system.description.value += `<h3>Proficiencies</h3><ul>`;
      for (const choice of this._parentOnlyChoices) {
        await this._addEffects(choice, this.type);
        this.data.system.description.value += `<li>${choice.label}</li>`;
      }

      this.data.system.description.value += `</ul>`;
      this.data.img = "icons/skills/trades/academics-book-study-purple.webp";
      this.data.name = this.data.name.split("Background: ").pop();

      this.enricher.addDocumentOverride();
      this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);
    } catch (err) {
      logger.warn(
        `Unable to Generate Background Feature: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

  static CHOICE_DEFS = DICTIONARY.parsing.choiceFeatures;

  async _buildChoiceFeature() {
    this._generateSystemType();
    this._generateSystemSubType();

    this._generateActivity({ hintsOnly: true });
    await this.enricher.addAdditionalActivities(this);

    // this._generateLimitedUse();
    // this._generateRange();

    const listItems = [];
    const chosenOnly = DDBFeature.CHOICE_DEFS.USE_CHOSEN_ONLY.includes(this.originalName);
    const choices = chosenOnly
      ? this._chosen
      : DDBFeature.CHOICE_DEFS.USE_ALL_CHOICES.includes(this.originalName)
        ? this._choices
        : this._parentOnlyChoices;
    const choiceText = choices
      .sort((a, b) => ((a.label < b.label) ? -1 : (a.label > b.label) ? 1 : 0))
      .reduce((p, c) => {
        if (c.description) {
          const nameReg = new RegExp(`^(<p>)?(?:<em><strong>|<strong>|<strong><em>)${c.label}\\.(?:<\\/strong><\\/em>|<\\/strong>|<\\/em><\\/strong>)`);
          const description = c.description.startsWith("<p>")
            ? c.description.replace(nameReg, "$1").trim()
            : `<p>${c.description.replace(nameReg, "$1").trim()}</p>`;
          return `${p}
<p><strong>${c.label}</strong></p>
${description}`;
        } else {
          listItems.push(`<li><p>${c.label}</p></li>`);
          return p;
        }
      }, "")
      .replaceAll("<p></p>", "");

    const joinedText = (listItems.length > 0)
      ? `${choiceText}
<ul>${listItems.join("")}</ul>`
      : choiceText;

    const secretText = DDBFeature.CHOICE_DEFS.NO_CHOICE_DESCRIPTION_ADDITION.includes(this.originalName)
      || ["feat"].includes(this.type) // don't add choice options for feats
      ? ""
      : DDBFeature.CHOICE_DEFS.NO_CHOICE_BUILD.includes(this.originalName)
        || DDBFeature.CHOICE_DEFS.NO_CHOICE_SECRET.includes(this.originalName)
        ? `<hr>${joinedText}`
        : `<hr><section class="secret">${joinedText}</section>`;

    this._generateDescription({ forceFull: chosenOnly, extra: secretText });
    await this._addEffects(undefined, this.type);

    // this._generateFlagHints();
    // this._generateResourceFlags();
    // this._addCustomValues();

    this.enricher.addDocumentOverride();
    this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);
  }


  async build() {
    try {
      if (this.naturalWeapon) {
        await this._buildNatural();
      } else if (this.type === "background") {
        // work around till background parsing support advancements
        this.isChoiceFeature = false;
        await this._buildBackground();
      } else if (this.isChoiceFeature) {
        logger.debug(`${this.name} has multiple choices and you need to pass this instance to DDBChoiceFeature`);
        await this._buildChoiceFeature();
      } else {
        await this._buildBasic();
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
