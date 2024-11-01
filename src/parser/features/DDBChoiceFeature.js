import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBFeature from "./DDBFeature.js";
import DDBFeatureEnricher from "../enrichers/DDBFeatureEnricher.js";


export default class DDBChoiceFeature extends DDBFeature {

  static KEEP_CHOICE_FEATURE = [
    "Genie's Vessel",
    "Mantle of Majesty",
    "The Third Eye",
    "Unbreakable Majesty",
    "Aspect of the Wilds",
    "Power of the Wilds",
    "Divine Order",
    "Blessed Strikes",
    "Elemental Fury",
    "Circle of the Land Spells",
    "Primal Order",
    "Fighting Style",
    "Hunter's Prey",
    "Defensive Tactics",
  ];

  static KEEP_CHOICE_FEATURE_NAME = [
    "Mantle of Majesty",
    "Pact Boon",
    "The Third Eye",
    "Unbreakable Majesty",
    "Druidic Warrior",
    "Primal Companion",
    "Hunter's Prey",
    "Defensive Tactics",
  ];

  static KEEP_CHOICE_FEATURE_NAME_STARTSWITH = [
    "Boon of ",
  ];

  static NO_FEATURE_PREFIX_NAME = [
    "Rune Carver",
  ];

  static NO_CHOICE_BUILD = [
    "Charger",
    "Crusher",
    "Dual Wielder",
    "Elemental Adept",
    "Mantle of Majesty",
    "Piercer",
    "Poisoner",
    "Rune Shaper",
    "Shadow Touched",
    "Shadow-Touched",
    "Slasher",
    "Telekinetic",
    "Telepathic",
    "The Third Eye",
    "Unbreakable Majesty",
    "Aspect of the Wilds",
    "Power of the Wilds",
    "Circle of the Land Spells",
    "Nature's Ward",
    "Deft Explorer",
    "Magic Initiate (Cleric)",
    "Magic Initiate (Druid)",
    "Magic Initiate (Wizard)",
    "Magic Initiate (Warlock)",
    "Magic Initiate (Sorcerer)",
    "Boon of Energy Resistance",
    "Musician",
    "Metamagic Options",
  ];

  static NO_CHOICE_SECRET = [
    "Divine Order",
    "Divine Order: Protector",
    "Divine Order: Thaumaturge",
    "Improved Blessed Strikes: Divine Strike",
    "Improved Blessed Strikes: Potent Spellcasting",
    "Improved Blessed Strikes",
    "Circle of the Land Spells",
    "Primal Order",
    "Elemental Fury",
    "Improved Elemental Fury",
    "Improved Elemental Fury: Potent Spellcasting",
    "Improved Elemental Fury: Primal Strike",
    "Hunter's Prey",
    "Defensive Tactics",
  ];

  static USE_ALL_CHOICES = [
  ];

  static NO_CHOICE_ACTIVITY = [
    "Mystic Arcanum (",
  ];

  static NO_CHOICE_DESCRIPTION_ADDITION = [
    "Charger",
    "Crusher",
    "Dual Wielder",
    "Mantle of Majesty",
    "Piercer",
    "Poisoner",
    "Rune Carver",
    "Rune Shaper",
    "Slasher",
    "Unbreakable Majesty",
    "Giant Ancestry",
    "Aspect of the Wilds",
    "Power of the Wilds",
    "Improved Elemental Fury",
    "Improved Elemental Fury: Potent Spellcasting",
    "Improved Elemental Fury: Primal Strike",
    "Nature's Ward",
    "Deft Explorer",
    "Otherworldly Glamour",
    "Breath Weapon",
    "Breath Weapon (Acid)",
    "Breath Weapon (Fire)",
    "Breath Weapon (Poison)",
    "Breath Weapon (Cold)",
    "Breath Weapon (Lightning)",
  ];

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

  async build(choice) {
    try {
      this._generateSystemType();

      logger.debug(`Adding choice ${choice.label}`);

      if (this.data.name === choice.label) {
        this._generateSystemSubType();
        return;
      }

      const replaceRegex = new RegExp(`${this.data.name}(?:\\s*)- `);
      this.data.name = !DDBChoiceFeature.KEEP_CHOICE_FEATURE_NAME.includes(this.ddbDefinition.name)
        && !DDBChoiceFeature.KEEP_CHOICE_FEATURE_NAME_STARTSWITH.some((prefix) => this.ddbDefinition.name.startsWith(prefix))
        && choice.label
        ? choice.label.startsWith(this.data.name.trim())
          ? choice.label.replace(replaceRegex, `${this.data.name}: `)
          : `${this.data.name}: ${choice.label}`
        : this.data.name;
      if (DDBChoiceFeature.NO_FEATURE_PREFIX_NAME.includes(this.ddbDefinition.name)) {
        const replace2Regex = new RegExp(`(${this.ddbDefinition.name}(?:[\\s:-]*))`);
        this.data.name = `${this.data.name}`.replace(replace2Regex, "");
      }

      this.data.name = utils.nameString(this.data.name);
      const intMatch = /^(\d+: )(.*)$/;
      const intNameMatch = intMatch.exec(this.data.name);
      if (intNameMatch) {
        this.data.name = intNameMatch[2].trim();
      }
      const namePointRegex = /(.*) \((\d) points?\)/i;
      const nameMatch = this.data.name.match(namePointRegex);
      if (nameMatch) {
        this.data.name = nameMatch[1];
        this.resourceCharges = Number.parseInt(nameMatch[2]);
      }
      this.originalName = this.data.name;
      foundry.utils.setProperty(this.data, "flags.ddbimporter.originalName", this.originalName);
      this._loadEnricher();
      this._generateSystemSubType();

      // get description for chris premades
      this.ddbDefinition.description = choice.description;
      this.ddbDefinition.snippet = choice.snippet ? choice.snippet : "";
      this._generateDescription({ forceFull: true });
      foundry.utils.setProperty(this.data, "flags.ddbimporter.initialFeature", foundry.utils.deepClone(this.data.system.description));
      foundry.utils.setProperty(this.ddbDefinition, "flags.ddbimporter.dndbeyond.choice", choice);

      if (!this.enricher.documentStub?.stopDefaultActivity)
        this._generateActivity();
      this.enricher.addAdditionalActivities(this);

      this._generateDescription({ forceFull: false });

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

      this.enricher.addDocumentOverride();
      this._addEffects(choice, this.type);
      this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);

    } catch (err) {
      logger.warn(
        `Unable to Generate Choice Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

  static NEVER_CHOICES = [
    "Strength",
    "Dexterity",
    "Constitution",
    "Intelligence",
    "Wisdom",
    "Charisma",
    "Strength Score",
    "Dexterity Score",
    "Constitution Score",
    "Intelligence Score",
    "Wisdom Score",
    "Charisma Score",
  ];

  static async buildChoiceFeatures(ddbFeature, allFeatures = false) {
    const features = [];
    if (DDBChoiceFeature.NO_CHOICE_BUILD.includes(ddbFeature.originalName)) return features;
    const choices = (allFeatures ? ddbFeature._parentOnlyChoices : ddbFeature._parentOnlyChosen)
      .filter((c) => !DDBChoiceFeature.NEVER_CHOICES.includes(c.label)); ;
    logger.debug(`Processing Choice Features ${choices.map((c) => c.label).join(",")}`, {
      _choices: ddbFeature._choices,
      _parentOnlyChoices: ddbFeature._parentOnlyChoices,
      _parentOnlyChosen: ddbFeature._parentOnlyChosen,
      choices,
      _chosen: ddbFeature._chosen,
      feature: ddbFeature,
      allFeatures,
    });
    const enricher = new DDBFeatureEnricher();
    await enricher.init();
    for (const choice of choices) {
      const choiceFeature = new DDBChoiceFeature({
        ddbData: ddbFeature.ddbData,
        ddbDefinition: foundry.utils.deepClone(ddbFeature.ddbDefinition),
        type: ddbFeature.type,
        rawCharacter: ddbFeature.rawCharacter,
        enricher,
      });
      await choiceFeature.build(choice);
      logger.debug(`DDBChoiceFeature.buildChoiceFeatures: ${choiceFeature.ddbDefinition.name}`, {
        choiceFeature,
        choice,
        ddbFeature,
      });
      // console.warn(`Choice generation ${choiceFeature.data.name}`, {
      //   data: deepClone(choiceFeature.data),
      // });
      if (choices.length === 1
        && !DDBChoiceFeature.KEEP_CHOICE_FEATURE.includes(ddbFeature.originalName)
      ) {
        ddbFeature.data.name = choiceFeature.data.name;
        if (Object.keys(ddbFeature.data.system.activities).length === 0
          && !DDBChoiceFeature.NO_CHOICE_ACTIVITY.some((a) => ddbFeature.originalName.startsWith(a))
        ) {
          ddbFeature.data.system.activities = choiceFeature.data.system.activities;
        }
        if (ddbFeature.data.effects.length === 0) {
          ddbFeature.data.effects = choiceFeature.data.effects;
        }
      } else {
        features.push(choiceFeature.data);
      }
    }

    return features;
  }

}
