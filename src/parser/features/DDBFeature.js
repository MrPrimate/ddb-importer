import DICTIONARY from "../../dictionary.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import AdvancementHelper from "../advancements/AdvancementHelper.js";
import DDBAttackAction from "./DDBAttackAction.js";
import DDBBaseFeature from "./DDBBaseFeature.js";


export default class DDBFeature extends DDBBaseFeature {

  static FORCE_UNARMED = [
    "Trunk",
    "Claws",
  ];

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
        )
      );
    this._choices = this.noMods ? [] : DDBHelper.getChoices(this.ddbData, this.type, this.ddbDefinition);
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
      }
    };
  }

  // eslint-disable-next-line class-methods-use-this
  _prepare() {
    // override this feature
  }

  _buildUnarmed() {
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

    const ddbAttackAction = new DDBAttackAction({
      ddbData: this.ddbData,
      ddbDefinition: strikeMock,
      rawCharacter: this.rawCharacter,
      type: this.type,
      documentType: "weapon",
    });
    ddbAttackAction.build();

    this.data = ddbAttackAction.data;
  }

  _buildBasic() {
    this._generateSystemType();
    this._generateSystemSubType();

    // this._generateLimitedUse();
    // this._generateRange();
    // this._generateResourceConsumption();
    // this._generateActivation();
    // this._generateLevelScaleDice();

    this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);

    this._generateDescription(true);
    this._addEffects(undefined, this.type);

    // this._generateFlagHints();
    // this._generateResourceFlags();
    // this._addCustomValues();
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

  _generateSkillAdvancements() {
    const mods = this.advancementHelper.noMods
      ? []
      : DDBHelper.getModifiers(this.ddbData, this.type);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.character.skills.map((s) => s.subType).includes(mod.subType)
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
      features: {}
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

      this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);

      logger.debug(`Found background ${this.ddbDefinition.name}`);
      logger.debug(`Found ${this._choices.map((c) => c.label).join(",")}`);

      this._generateDescription(true);
      this.data.system.description.value += `<h3>Proficiencies</h3><ul>`;
      this._choices.forEach((choice) => {
        this._addEffects(choice, this.type);
        this.data.system.description.value += `<li>${choice.label}</li>`;
      });
      this.data.system.description.value += `</ul>`;
      this.data.img = "icons/skills/trades/academics-book-study-purple.webp";
      this.data.name = this.data.name.split("Background: ").pop();

    } catch (err) {
      logger.warn(
        `Unable to Generate Background Feature: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension"
      );
      logger.error("Error", err);
    }
  }


  build() {
    try {
      if (DDBFeature.FORCE_UNARMED.includes(this.data.name)) {
        this._buildUnarmed();
      } else if (this.type === "background") {
        // work around till background parsing support advancements
        this.isChoiceFeature = false;
        this._buildBackground();
      } else if (this.isChoiceFeature) {
        logger.debug(`${this.name} has multiple choices and you  need to pass this instance to DDBChoiceFeature`);
        //  DDBChoiceFeature.buildChoiceFeatures(this);
      } else {
        this._buildBasic();
      }
    } catch (err) {
      logger.warn(
        `Unable to Generate Basic Feature: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension"
      );
      logger.error("Error", err);
    }
  }

}
