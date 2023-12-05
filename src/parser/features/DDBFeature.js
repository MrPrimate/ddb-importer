import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBAttackAction from "./DDBAttackAction.js";
import DDBBaseFeature from "./DDBBaseFeature.js";


export default class DDBFeature extends DDBBaseFeature {

  static FORCE_UNARMED = ["Trunk"];

  static DOC_TYPE = {
    class: "feat",
    subclass: "feat",
    race: "feat",
    background: "background",
    feat: "feat",
  };

  _init() {
    this.documentType = DDBFeature.DOC_TYPE[this.type];
    this.tagType = this.type;
    logger.debug(`Generating Feature ${this.ddbDefinition.name}`);
    this._class = this.ddbData.character.classes.find((klass) =>
      (this.ddbDefinition.classId
        && (klass.definition.id === this.ddbDefinition.classId || klass.subclassDefinition?.id === this.ddbDefinition.classId))
      || (this.ddbDefinition.className && klass.definition.name === this.ddbDefinition.className
        && ((!this.ddbDefinition.subclassName || this.ddbDefinition.subclassName === "")
          || (this.ddbDefinition.subclassName && klass.subclassDefinition?.name === this.ddbDefinition.subclassName))
      )
    );
    this._choices = DDBHelper.getChoices(this.ddbData, this.type, this.ddbDefinition);
    this.isChoiceFeature = this._choices.length > 0;
    this.include = !this.isChoiceFeature;
    this.hasRequiredLevel = !this._class || (this._class && this._class.level >= this.ddbDefinition.requiredLevel);
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

    const unarmedStrikeMock = deepClone(CONFIG.DDB.naturalActions[0]);
    unarmedStrikeMock.displayAsAttack = true;
    const strikeMock = Object.assign(unarmedStrikeMock, override);

    const ddbAttackAction = new DDBAttackAction({
      ddbData: this.ddbData,
      ddbDefinition: strikeMock,
      rawCharacter: this.rawCharacter
    });
    ddbAttackAction.build();

    this.data = ddbAttackAction.data;
  }

  _buildBasic() {
    this._generateSystemType();

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

  _buildBackground() {
    try {
      this._generateSystemType();

      this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);

      logger.debug(`Found background ${this.ddbDefinition.name}`);
      logger.debug(`Found ${this._choices.map((c) => c.label).join(",")}`);

      this._generateDescription(true);
      this.data.system.description.value += `<h3>Choices</h3><ul>`;
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
