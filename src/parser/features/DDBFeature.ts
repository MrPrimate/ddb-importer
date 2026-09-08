import { DICTIONARY } from "../../config/_module";
import { utils, logger, CompendiumHelper } from "../../lib/_module";
import AdvancementHelper from "../advancements/AdvancementHelper";
import { DDBModifiers, DDBDataUtils, SystemHelpers } from "../lib/_module";
import DDBAttackAction from "./DDBAttackAction";
import DDBChoiceFeature from "./DDBChoiceFeature";
import DDBFeatureMixin from "./DDBFeatureMixin";

export default class DDBFeature extends DDBFeatureMixin {

  declare advancementHelper: AdvancementHelper;
  declare isChoiceFeature: boolean;
  declare include: boolean;
  declare hasRequiredLevel: boolean;

  // assigned in _init() from the mixin constructor, so these must not be runtime fields
  declare _parentOnlyChoices: ReturnType<typeof DDBDataUtils.getChoices>;
  declare _parentOnlyChosen: ReturnType<typeof DDBDataUtils.getChoices>;

  static DOC_TYPE = {
    class: "feat" as const, // class feature
    subclass: "feat" as const, // subclass feature
    race: "feat" as const,
    background: "background" as const,
    feat: "feat" as const,
  };

  static LEVEL_SCALE_EXCLUSION_USES = [
    "Destroy Undead",
    "Magical Cunning",
    "Brutal Strike",
    "Extra Attack",
    "Improved Critical",
    "Unarmored Movement",
    "Metamagic",
    "Group Recovery",
    "Rallying Surge",
    "Spellfire Burst",
  ];

  static LEVEL_SCALE_EXCLUSION_USES_STARTS_WITH = [
    "Aura of ",
  ];


  _init() {
    this.documentType = DDBAttackAction.FORCE_WEAPON_FEATURES.includes(this.originalName)
      ? "weapon" as const
      : DDBFeature.DOC_TYPE[this.type];
    this.tagType = this.type;
    logger.debug(`Init Feature ${this.ddbDefinition.name}`);
    this._class = this._findClassForDefinition(this.ddbDefinition);
    this._choices = DDBDataUtils.getChoices({
      ddb: this.ddbData,
      type: this.type,
      feat: this.ddbDefinition,
      selectionOnly: false,
    }).reduce((p, c) => {
      if (c.parentChoiceId !== null) return p;
      if (!p.some((e) => e.id === c.id)) p.push(c);
      return p;
    }, []);
    this._chosen = DDBDataUtils.getChoices({
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
      isMuncher: this.ddbCharacter?.isMuncher ?? this.isMuncher,
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
          isChoiceFeature: this.isChoiceFeature,
          id: this.ddbDefinition.id,
          type: this.tagType,
          entityTypeId: this.ddbDefinition.entityTypeId,
          is2014: this.type === "class" && this._class ? this.isClass2014 : this.is2014,
          is2024: this.type === "class" && this._class ? !this.isClass2014 : !this.is2014,
          legacy: this.legacy,
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
  }


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

  async _buildBasic() {
    this._generateSystemType();
    this._generateSystemSubType();
    this._generateLimitedUse();

    await this._generateSummons();
    await this._generateCompanions();
    await this._generateActivity({ hintsOnly: true });
    await this.enricher.addAdditionalActivities(this);

    this._generateDescription({ forceFull: true });
    await this._addEffects(undefined, this.type);

    this.cleanup();
    await this.enricher.addDocumentAdvancements();
    await this.enricher.addDocumentOverride();
    this._final();
    await this.enricher.cleanup();
  }

  async _generateFeatureAdvancements() {
    // STUB
    logger.info(`Generating feature advancements for ${this.ddbDefinition.name} are not yet supported`);
  }

  _addAdvancement(advancement) {
    if (!advancement) return;
    const advancementData = advancement.toObject();
    // an advancement built from a bare configuration (no choices, grants or items) carries nothing
    if (
      (advancementData.value && Object.keys(advancementData.value).length !== 0)
      || (foundry.utils.getProperty(advancementData, "configuration.choices") as unknown[] | undefined)?.length !== 0
      || (foundry.utils.getProperty(advancementData, "configuration.grants") as unknown[] | undefined)?.length !== 0
      || (foundry.utils.getProperty(advancementData, "configuration.items") as unknown[] | undefined)?.length !== 0
    ) {
      if (!advancementData._id) advancementData._id = foundry.utils.randomID();
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
      feats.some((f) => m.componentId == f.definition.id && m.componentTypeId == f.definition.entityTypeId),
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


  _addFeatAbilityScoreAdvancement(update, advancement) {
    advancement.updateSource(update);
    if (!this.isMuncher) {
      const modifiers = this.ddbData.character.modifiers.feat.filter((m) =>
        m.componentId == this.ddbDefinition.id
        && m.componentTypeId == this.ddbDefinition.entityTypeId,
      );

      if (modifiers.length > 0) {
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
      }
    }

    this.data.system.advancement.push(advancement.toObject());
  }


  generateFeatAbilityScoreAdvancement() {
    const advancement = new game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement();
    // duplicate rather than toObject: works on the live DataModel and on plain configuration objects
    const configuration = foundry.utils.duplicate(advancement.configuration ?? {});
    configuration.points = 0;
    configuration.cap = 1;
    configuration.level = 0;
    configuration.value = { type: "asi" };

    const maxRegex = /to a maximum of (\d{2})/i;
    const maxMatch = this.ddbDefinition.description.match(maxRegex);
    if (maxMatch) {
      const capValue = parseInt(maxMatch[1]);
      if (Number.isInteger(capValue)) {
        configuration.max = capValue;
      }
    }

    let hint = "";
    const hintRegex = /(?:Increase|Choose| Increase the) (\w+) ability (.+?) to a maximum of (\d{2})\./i;
    const hintMatch = this.ddbDefinition.description.match(hintRegex);
    if (hintMatch) {
      hint = hintMatch[0];
    }
    // ANY matches
    // Ability Score Increase. Choose one ability in which you lack saving throw proficiency. Increase the chosen ability score by 1, to a maximum of 20.
    // Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 20.
    // Choose one ability score. You gain the following benefits:
    //   Increase the chosen ability score by 1, to a maximum of 20.
    // Ability Score Increase. Increase an ability score of your choice by 1, to a maximum of 20.

    const anyRegex = /choose one ability|increase (one|a|an) ability score of your choice/i;
    const anyMatch = this.ddbDefinition.description.match(anyRegex);

    if (anyMatch) {
      configuration.points = 1;
      this._addFeatAbilityScoreAdvancement({ configuration, hint }, advancement);
      return;
    }

    let hasMatch = false;

    if (hint === "") {
      const hint2Regex = /(?:Increase your) (.+?) to a maximum of (\d{2})\./i;
      const hint2Match = this.ddbDefinition.description.match(hint2Regex);
      if (hint2Match) {
        hint = hint2Match[0];
      }
    }

    // Ability Score Increase. Increase your Charisma score by 1, to a maximum of 20.
    // Increase your Charisma score by 1, to a maximum of 20.

    const fixedRegex = /Increase your (\w+) score by (\d)/i;
    const fixedMatch = this.ddbDefinition.description.match(fixedRegex);
    if (fixedMatch) {
      // eslint-disable-next-line no-useless-assignment
      hasMatch = true;
      const ability = DICTIONARY.actor.abilities.find((a) => a.long === fixedMatch[1].trim().toLowerCase());
      if (ability) {
        (configuration.fixed ??= {})[ability.value] = parseInt(fixedMatch[2]);
      }
      this._addFeatAbilityScoreAdvancement({ configuration, hint }, advancement);
      return;
    }

    // locked
    // 2024
    // Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.
    // Ability Score Increase. Increase your Constitution or Strength score by 1, to a maximum of 20.
    // 2014
    // Increase your Strength or Dexterity score by 1, to a maximum of 20.
    // Increase your Strength, Constitution, or Charisma score by 1, to a maximum of 20.

    const lockedRegex = /increase your (.*?) score/i;
    const lockedMatches = this.ddbDefinition.description.match(lockedRegex);
    if (lockedMatches) {
      const splits = lockedMatches[1].replaceAll(", or ", ", ").replaceAll(" or ", ", ").split(",");
      hasMatch = true;
      configuration.points = 1;
      const locked = new Set(DICTIONARY.actor.abilities.map((a) => a.value));
      for (const split of splits) {
        const ability = DICTIONARY.actor.abilities.find((a) => a.long === split.trim().toLowerCase());
        if (ability) {
          locked.delete(ability.value);
        }
      }
      configuration.locked = Array.from(locked);
    }

    if (!hasMatch) return;
    this._addFeatAbilityScoreAdvancement({ configuration, hint }, advancement);

  }

  _generateSkillAdvancements() {
    const mods = DDBModifiers.getModifiers(this.ddbData, this.type);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.actor.skills.map((s) => s.subType).includes(mod.subType),
    );
    const advancement = this.advancementHelper.getSkillAdvancement({
      mods: skillExplicitMods,
      feature: this.ddbDefinition,
      level: 0,
    });
    this._addAdvancement(advancement);
  }

  _generateLanguageAdvancements() {
    const mods = DDBModifiers.getModifiers(this.ddbData, this.type);

    const advancement = this.advancementHelper.getLanguageAdvancement(mods, this.ddbDefinition, 0);
    this._addAdvancement(advancement);
  }

  _generateToolAdvancements() {
    const mods = DDBModifiers.getModifiers(this.ddbData, this.type);
    const advancement = this.advancementHelper.getToolAdvancement({
      mods: mods,
      feature: this.ddbDefinition,
      level: 0,
    });
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

    // console.warn("BACKGROUND FEAT", {
    //   this: this,
    //   extraFeatIds,
    //   featIds,
    // })

    if (featIds.length === 0) return;

    const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
    const indexFilter = {
      fields: [
        "name",
        "flags.ddbimporter.id",
      ],
    };
    const compendium = CompendiumHelper.getCompendiumType("feats", false);
    if (compendium) await compendium.getIndex(indexFilter);

    const feats = compendium
      ? compendium.index.filter((f) => featIds.includes(foundry.utils.getProperty(f, "flags.ddbimporter.id")))
      : [];

    // console.warn("BACKGROUND FEAT", {
    //   this: this,
    //   extraFeatIds,
    //   feats,
    //   compendium,
    //   featIds,
    // });

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
      // this.data.system.description.value += `<h3>Proficiencies</h3><ul>`;
      // for (const choice of this._parentOnlyChoices) {
      //   await this._addEffects(choice, this.type);
      //   this.data.system.description.value += `<li>${choice.label}</li>`;
      // }

      this.data.system.description.value += `</ul>`;
      this.data.img = "icons/skills/trades/academics-book-study-purple.webp";
      this.data.name = this.data.name.split("Background: ").pop();

      await this.enricher.addDocumentOverride();
      this._final();
      await this.enricher.cleanup();
    } catch (err) {
      logger.warn(
        `Unable to Generate Background Feature: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error(`Unable to Generate Background Feature: ${this.name}`, err);
    }
  }

  static CHOICE_DEFS = DICTIONARY.parsing.choiceFeatures;

  static MIN_CHOICE_CONTAINMENT_LENGTH = 40;

  // DDB truncates the option copy mid-sentence and terminates it, where the parent runs on
  // ("...finish a Long Rest." vs "...finish a Long Rest unless you take a level of
  // Exhaustion")
  static TRAILING_SENTENCE_PUNCTUATION = /[\s.,;:]+$/;

  /**
   * DDB represents builder on/off toggles as a choice with exactly one
   * available option, labelled "Activate <Feature>" or "Invoke the <Feature>"
   * (Bladesong, Elemental Attunement, ...). Building that lone option as a
   * choice feature only renames the parent; suppress it instead.
   * Tested against the raw parent-only pool, not the NEVER_CHOICES/skill/tool
   * filtered list - the rule only applies when the toggle is the whole pool.
   * Opt out via KEEP_CHOICE_FEATURE if a real "Activate X" choice needs building.
   */
  get isSingleToggleChoice(): boolean {
    if (DDBFeature.CHOICE_DEFS.KEEP_CHOICE_FEATURE.includes(this.originalName)) return false;
    const pool = this._parentOnlyChoices ?? [];
    return pool.length === 1
      && DDBFeature.CHOICE_DEFS.SINGLE_CHOICE_TOGGLE_PREFIXES
        .some((prefix) => (pool[0].label ?? "").startsWith(prefix));
  }

  get suppressesChoiceBuild(): boolean {
    return super.suppressesChoiceBuild || this.isSingleToggleChoice;
  }

  /**
   * DDB often ships an option whose description is a verbatim copy of the parent
   * feature's own description (Brand of Axiom), or quotes it inside a larger blob.
   * Appending that as a choice block just repeats the paragraph above it, so detect
   * it by content rather than growing NO_CHOICE_DESCRIPTION_ADDITION for each one.
   */
  static isChoiceDescriptionRedundant(parentDescription: string, choiceDescription: string): boolean {
    const lesserChoice = utils.renderLesserString(choiceDescription ?? "")
      .replace(DDBFeature.TRAILING_SENTENCE_PUNCTUATION, "");
    const lesserParent = utils.renderLesserString(parentDescription ?? "")
      .replace(DDBFeature.TRAILING_SENTENCE_PUNCTUATION, "");
    if (lesserChoice === "" || lesserParent === "") return false;
    if (lesserChoice === lesserParent) return true;
    // a short option line can appear inside an unrelated parent by coincidence;
    // exact matches are always safe, containment needs some substance behind it
    return lesserChoice.length >= DDBFeature.MIN_CHOICE_CONTAINMENT_LENGTH
      && lesserParent.includes(lesserChoice);
  }

  async _buildChoiceFeature() {
    this._generateSystemType();
    this._generateSystemSubType();

    await this._generateSummons();
    await this._generateCompanions();
    await this._generateActivity({ hintsOnly: true });
    await this.enricher.addAdditionalActivities(this);

    // this._generateLimitedUse();
    // this._generateRange();

    const listItems = [];
    const replaceDescription = DDBFeature.CHOICE_DEFS.REPLACE_DESCRIPTION_WITH_CHOICES.includes(this.originalName);
    const chosenOnly = replaceDescription || DDBFeature.CHOICE_DEFS.USE_CHOSEN_ONLY.includes(this.originalName);
    const choices = chosenOnly
      ? this._chosen
      : DDBFeature.CHOICE_DEFS.USE_ALL_CHOICES.includes(this.originalName)
        ? this._choices
        : this._parentOnlyChoices;

    const parentDescription = this.descriptionOverride
      ?? (foundry.utils.getProperty(this.ddbDefinition, "description") as string)
      ?? "";

    const choiceText = choices
      .filter((c) =>
        !DDBChoiceFeature.NEVER_CHOICES.includes(c.label)
        && !DICTIONARY.actor.skills.map((s) => s.label).includes(c.label)
        && !DICTIONARY.actor.proficiencies.filter((p) => p.type === "Tool").map((p) => p.name).includes(utils.nameString(c.label)),
      )
      .filter((c) => {
        // Blood Curses et al. use the choice text AS the description; the parent is the
        // full option list, so every choice would be "contained" and we'd erase the lot
        if (replaceDescription) return true;
        const redundant = DDBFeature.isChoiceDescriptionRedundant(parentDescription, c.description ?? "");
        if (redundant) {
          logger.debug(`Dropping choice "${c.label}" from ${this.originalName}: description duplicated by the parent`);
        }
        return !redundant;
      })
      .sort((a, b) => ((a.label < b.label) ? -1 : (a.label > b.label) ? 1 : 0))
      .reduce((p, c) => {
        if (!p.some((e) => e.label === c.label)) p.push(c);
        return p;
      }, [])
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

    // DDB ships the full option list as the parent description (e.g. every blood
    // curse); swap it for the chosen options only. Skipped when nothing is chosen so
    // the feature never ends up with a blank description.
    const useChoicesAsDescription = replaceDescription && joinedText.trim() !== "";
    if (useChoicesAsDescription) this.descriptionOverride = joinedText.trim();

    const secretText = useChoicesAsDescription
      || DDBFeature.CHOICE_DEFS.NO_CHOICE_DESCRIPTION_ADDITION.includes(this.originalName)
      || ["feat"].includes(this.type) // don't add choice options for feats
      || joinedText.trim() === ""
      ? ""
      : this.suppressesChoiceBuild
        || DDBFeature.CHOICE_DEFS.NO_CHOICE_SECRET.includes(this.originalName)
        ? `<hr>${joinedText}`
        : `<hr><section class="secret">${joinedText}</section>`;

    this._generateDescription({ forceFull: chosenOnly, extra: secretText });
    await this._addEffects(undefined, this.type);

    // this._generateFlagHints();
    // this._generateResourceFlags();
    // this._addCustomValues();

    await this.enricher.addDocumentOverride();
    this._final();
  }


  async build() {
    try {
      if (this.type === "background") {
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
      logger.error(`Unable to Generate Basic Feature: ${this.name}`, err);
    }
  }

}
