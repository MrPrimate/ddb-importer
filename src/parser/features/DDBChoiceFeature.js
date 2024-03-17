import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBFeature from "./DDBFeature.js";


export default class DDBChoiceFeature extends DDBFeature {

  _prepare() {
    this._levelScale = null;
    this._levelScales = null;
    this._limitedUse = null;
    this._classOption = null;

    this._classFeatureComponent = DDBHelper.findComponentByComponentId(this.ddbData, this.ddbDefinition.id);

    if (!this._classFeatureComponent) {
      this._classOption = [
        this.ddbData.character.options.race,
        this.ddbData.character.options.class,
        this.ddbData.character.options.feat,
      ]
        .flat()
        .find((option) => option.definition.id === this.ddbDefinition.componentId);
      if (this._classOption) {
        this._classFeatureComponent = DDBHelper.findComponentByComponentId(this.ddbData, this._classOption.componentId);
      }
    }

    if (this._classFeatureComponent) {
      this._levelScale = this._classFeatureComponent.levelScale;
      this._levelScales = this._classFeatureComponent.definition?.levelScales;
      this._limitedUse = this._classFeatureComponent.definition?.limitedUse;
      // I don't think I actually use these
      // foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScale", this._levelScale);
      // foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScales", this._levelScales);
      // foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.limitedUse", this._limitedUse);
    }

  }


  build(choice) {
    try {
      this._generateSystemType();

      logger.debug(`Adding choice ${choice.label}`);

      if (this.data.name === choice.label) {
        this._generateSystemSubType();
        return;
      }

      this.data.name = choice.label
        ? choice.label.startsWith(this.data.name.trim())
          ? choice.label
          : `${this.data.name}: ${choice.label}`
        : this.data.name;
      this.data.name = utils.nameString(this.data.name);
      this._generateSystemSubType();
      if (choice.wasOption && choice.description) {
        this.ddbDefinition.description = choice.description;
        this.ddbDefinition.snippet = choice.snippet ? choice.snippet : "";
      } else {
        if (this.ddbDefinition.description) {
          this.ddbDefinition.description = choice.description
            ? this.ddbDefinition.description + "<h3>" + choice.label + "</h3>" + choice.description
            : this.ddbDefinition.description;
        }
        if (this.ddbDefinition.snippet) {
          this.ddbDefinition.snippet = choice.description
            ? this.ddbDefinition.snippet + "<h3>" + choice.label + "</h3>" + choice.description
            : this.ddbDefinition.snippet;
        }
      }
      // add these flags in so they can be used by the description parser
      foundry.utils.setProperty(this.ddbDefinition, "flags.ddbimporter.dndbeyond.choice", choice);

      this._generateDescription(false);
      this.data.flags.ddbimporter.dndbeyond.choice = {
        label: choice.label,
        choiceId: choice.choiceId,
        componentId: choice.componentId,
        componentTypeId: choice.componentTypeId,
        parentChoiceId: choice.parentChoiceId,
        subType: choice.subType,
        wasOption: choice.wasOption,
        entityTypeId: choice.entityTypeId,
        type: choice.type,
      };

      this.data._id = foundry.utils.randomID();
      this._addEffects(choice, this.type);

      // these are common but need moving
      // this._generateLimitedUse();
      // this._generateRange();
      // this._generateResourceConsumption();
      // this._generateActivation();

      // this._generateActivation();
      // this._generateDescription();

      // this._generateResourceConsumption();
      // this._generateRange();
      // this._generateAttackType();

      // if (this.data.system.damage.parts.length === 0) {
      //   logger.debug("Running level scale parser");
      //   this._generateLevelScaleDice();
      // }

      // this._generateFlagHints();
      // this._generateResourceFlags();


      // this._addCustomValues();
    } catch (err) {
      logger.warn(
        `Unable to Generate Choice Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension"
      );
      logger.error("Error", err);
    }
  }

  static buildChoiceFeatures(ddbFeature) {
    logger.debug(`Processing ${ddbFeature._choices.map((c) => c.label).join(",")}`);
    const features = [];
    ddbFeature._choices.forEach((choice) => {
      const choiceFeature = new DDBChoiceFeature({
        ddbData: ddbFeature.ddbData,
        ddbDefinition: foundry.utils.deepClone(ddbFeature.ddbDefinition),
        type: ddbFeature.type,
        rawCharacter: ddbFeature.rawCharacter,
      });
      choiceFeature.build(choice);
      logger.debug(`DDBChoiceFeature.buildChoiceFeatures: ${choiceFeature.ddbDefinition.name}`, {
        choiceFeature,
        choice,
        this: this,
      });
      features.push(choiceFeature.data);
    });
    return features;
  }

}
