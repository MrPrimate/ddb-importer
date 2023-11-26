import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import SETTINGS from "../../settings.js";
import { generateEffects } from "../../effects/effects.js";
import { generateBaseACItemEffect } from "../../effects/acEffects.js";


export default class DDBAction {

  static LEVEL_SCALE_EXCLUSION = [
    "Fire Rune",
    "Cloud Rune",
    "Stone Rune",
    "Frost Rune",
    "Hill Rune",
    "Storm Rune",
  ];

  static LEVEL_SCALE_INFUSIONS = [
    "Unarmed Strike",
    "Arms of the Astral Self (WIS)",
    "Arms of the Astral Self (DEX)",
    "Arms of the Astral Self (DEX/STR)",
    "Body of the Astral Self",
    "Starry Form: Archer",
    "Sneak Attack",
  ];

  _init() {
    this.actionType = "feat";
    logger.debug(`Generating Action ${this.ddbAction.name}`);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: DDBHelper.getName(this.ddbData, this.ddbAction, this.rawCharacter),
      type: this.actionType,
      system: utils.getTemplate(this.actionType),
      flags: {
        ddbimporter: {
          id: this.ddbAction.id,
          entityTypeId: this.ddbAction.entityTypeId,
          action: true,
          componentId: this.ddbAction.componentId,
          componentTypeId: this.ddbAction.componentTypeId,
          originalName: DDBHelper.getName(this.ddbData, this.ddbAction, this.rawCharacter, false),
          type: "other",
          isCustomAction: this.ddbAction.isCustomAction,
        },
        infusions: { infused: false },
        obsidian: {
          source: {
            type: "other",
          },
        }
      },
    };
  }

  displayAsAttack() {
    const customDisplay = this.rawCharacter
      ? DDBHelper.getCustomValueFromCharacter(this.ddbAction, this.rawCharacter, 16)
      : DDBHelper.getCustomValue(this.ddbAction, this.ddbData, 16);
    if (typeof customDisplay == "boolean") {
      return customDisplay;
    } else if (hasProperty(this.ddbAction, "displayAsAttack")) {
      return this.ddbAction.displayAsAttack;
    } else {
      return false;
    }
  }

  constructor(ddbData, ddbAction, rawCharacter = null) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.ddbAction = ddbAction.definition ?? ddbAction;
    this.name = this.ddbAction.name;
    this._init();

    // this._attacksAsFeatures = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-actions-as-features");

    this._generateDataStub();

    if (this.ddbAction.infusionFlags) {
      setProperty(this.data, "flags.infusions", this.ddbAction.infusionFlags);
    }

    this._actionType = {
      class: this.ddbData.character.actions.class
        .filter((ddbAction) => DDBHelper.findClassByFeatureId(this.ddbData, ddbAction.componentId))
        .find((ddbAction) => {
          const name = DDBHelper.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
      race: this.ddbData.character.actions.race
        .some((ddbAction) => {
          const name = DDBHelper.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
      feat: this.ddbData.character.actions.feat
        .some((ddbAction) => {
          const name = DDBHelper.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
    };
  }

  build() {
    try {
      this._generateSystemActionType();
      this._generateActivation();
      this._generateDescription();
      this._generateLimitedUse();
      this._generateResourceConsumption();
      this._generateRange();
      this._generateAttackType();

      if (this.data.system.damage.parts.length === 0) {
        logger.debug("Running level scale parser");
        this._generateLevelScaleDice();
      }

      this._generateFlagHints();
      this._generateResourceFlags();

      this._addFeatEffects();
      this._addCustomValues();
    } catch (err) {
      logger.warn(
        `Unable to Generate Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension"
      );
    }
  }

  _generateSystemActionType() {
    if (this.ddbData.character.actions.class.some((a) =>
      a.name === this.ddbAction.name
      || (hasProperty(a, "definition.name") && a.definition.name === this.ddbAction.definition?.name)
    )) {
      this.data.system.type.value = "class";
    } else if (this.ddbData.character.actions.race.some((a) =>
      a.name === this.ddbAction.name
      || (hasProperty(a, "definition.name") && a.definition.name === this.ddbAction.definition?.name)
    )) {
      this.data.system.type.value = "race";
    } else if (this.ddbData.character.actions.feat.some((a) =>
      a.name === this.ddbAction.name
      || (hasProperty(a, "definition.name") && a.definition.name === this.ddbAction.definition?.name)
    )) {
      this.data.system.type.value = "feat";
    }
  }

  _generateActivation() {
    if (!this.ddbAction.activation) return;
    const actionType = DICTIONARY.actions.activationTypes
      .find((type) => type.id === this.ddbAction.activation.activationType);
    const activation = !actionType
      ? {}
      : {
        type: actionType.value,
        cost: this.ddbAction.activation.activationTime || 1,
        condition: "",
      };
    this.data.system.activation = activation;
  }

  _getClassFeatureDescription() {
    const componentId = this.ddbAction.componentId;
    const componentTypeId = this.ddbAction.componentTypeId;

    const findFeatureKlass = this.ddbData.character.classes
      .find((cls) => cls.classFeatures.find((feature) =>
        feature.definition.id == componentId
        && feature.definition.entityTypeId == componentTypeId
      ));

    if (findFeatureKlass) {
      const feature = findFeatureKlass.classFeatures
        .find((feature) =>
          feature.definition.id == componentId
          && feature.definition.entityTypeId == componentTypeId
        );
      if (feature) {
        return parseTemplateString(this.ddbData, this.rawCharacter, feature.definition.description, this.ddbAction).text;
      }
    }
    return "";
  }

  static buildFullDescription(main, summary, title) {
    let result = "";

    if (summary && !utils.stringKindaEqual(main, summary) && summary.trim() !== "" && main.trim() !== "") {
      result += summary.trim();
      result += `
  <details>
    <summary>
      ${title ? title : "More Details"}
    </summary>
    <p>
      ${main.trim()}
    </p>
  </details>`;
    } else if (main.trim() === "") {
      result += summary.trim();
    } else {
      result += main.trim();
    }

    return result;
  }

  _generateDescription(forceFull = false) {
    // for now none actions probably always want the full text
    const useFullSetting = game.settings.get("ddb-importer", "character-update-policy-use-full-description");
    const useFull = forceFull || useFullSetting;
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");

    const rawSnippet = this.ddbAction.snippet
      ? parseTemplateString(this.ddbData, this.rawCharacter, this.ddbAction.snippet, this.ddbAction).text
      : "";

    const description = this.ddbAction.description && this.ddbAction.description !== ""
      ? parseTemplateString(this.ddbData, this.rawCharacter, this.ddbAction.description, this.ddbAction).text
      : this.getClassFeatureDescription();

    const snippet = utils.stringKindaEqual(description, rawSnippet) ? "" : rawSnippet;
    const fullDescription = DDBAction._buildFullDescription(description, snippet);
    const value = !useFull && snippet.trim() !== "" ? snippet : fullDescription;

    this.data.system.description = {
      value: value,
      chat: chatAdd ? snippet : "",
      unidentified: "",
    };
  }

  // eslint-disable-next-line complexity
  _generateLimitedUse() {
    if (
      this.ddbAction.limitedUse
      && (this.ddbAction.limitedUse.maxUses || this.ddbAction.limitedUse.statModifierUsesId || this.ddbAction.limitedUse.useProficiencyBonus)
    ) {
      const resetType = DICTIONARY.resets.find((type) => type.id === this.ddbAction.limitedUse.resetType);
      let maxUses = (this.ddbAction.limitedUse.maxUses && this.ddbAction.limitedUse.maxUses !== -1) ? this.ddbAction.limitedUse.maxUses : 0;

      if (hasProperty(this.ddbAction, "limitedUse.statModifierUsesId")) {
        const ability = DICTIONARY.character.abilities.find(
          (ability) => ability.id === this.ddbAction.limitedUse.statModifierUsesId
        ).value;

        if (maxUses === 0) {
          maxUses = `@abilities.${ability}.mod`;
        } else {
          switch (this.ddbAction.limitedUse.operator) {
            case 2:
              maxUses = `${maxUses} * @abilities.${ability}.mod`;
              break;
            case 1:
            default:
              maxUses = `${maxUses} + @abilities.${ability}.mod`;
          }
        }
      }

      if (hasProperty(this.ddbAction, "limitedUse.useProficiencyBonus")) {
        if (maxUses === 0) {
          maxUses = `@prof`;
        } else {
          switch (this.ddbAction.limitedUse.proficiencyBonusOperator) {
            case 2:
              maxUses = `${maxUses} * @prof`;
              break;
            case 1:
            default:
              maxUses = `${maxUses} + @prof`;
          }
        }
      }

      const finalMaxUses = (maxUses)
        ? Number.isInteger(maxUses)
          ? parseInt(maxUses)
          : maxUses
        : null;

      this.data.system.uses = {
        value: (finalMaxUses !== null && finalMaxUses != 0) ? maxUses - this.ddbAction.limitedUse.numberUsed : null,
        max: (finalMaxUses != 0) ? finalMaxUses : null,
        per: resetType ? resetType.value : "",
      };
    }
  }

  _generateResourceConsumption() {
    if (!this.rawCharacter) return;

    Object.keys(this.rawCharacter.system.resources).forEach((resource) => {
      const detail = this.rawCharacter.system.resources[resource];
      if (this.ddbAction.name === detail.label) {
        this.data.system.consume = {
          type: "attribute",
          target: `resources.${resource}.value`,
          amount: 1,
        };
      }
    });

    const kiPointRegex = /(?:spend|expend) (\d) ki point/;
    const match = this.data.system.description.value.match(kiPointRegex);
    if (match) {
      setProperty(this.data, "system.consume.amount", match[1]);
    }

  }

  _generateRange() {
    if (this.ddbAction.range && this.ddbAction.range.aoeType && this.ddbAction.range.aoeSize) {
      this.data.system.range = { value: null, units: "self", long: "" };
      this.data.system.target = {
        value: this.ddbAction.range.aoeSize,
        type: DICTIONARY.actions.aoeType.find((type) => type.id === this.ddbAction.range.aoeType)?.value,
        units: "ft",
      };
    } else if (this.ddbAction.range && this.ddbAction.range.range) {
      this.data.system.range = {
        value: this.ddbAction.range.range,
        units: "ft",
        long: this.ddbAction.range.long || "",
      };
    } else {
      this.data.system.range = { value: 5, units: "ft", long: "" };
    }
  }

  // eslint-disable-next-line complexity
  _generateDamage() {
    const damageType = this.ddbAction.damageTypeId
      ? DICTIONARY.actions.damageType.find((type) => type.id === this.ddbAction.damageTypeId).name
      : null;

    // when the action type is not set to melee or ranged we don't apply the mod to damage
    const meleeOrRangedAction = this.ddbAction.attackTypeRange || this.ddbAction.rangeId;
    const modBonus = (this.ddbAction.statId || this.ddbAction.abilityModifierStatId) && !this.ddbAction.isOffhand && meleeOrRangedAction ? " + @mod" : "";
    const die = this.ddbAction.dice ? this.ddbAction.dice : this.ddbAction.die ? this.ddbAction.die : undefined;
    // const fixedBonus = die?.fixedValue ? ` + ${die.fixedValue}` : "";
    const fixedBonus = die?.fixedValue
      ? (this.ddbAction.snippet ?? this.ddbAction.description ?? "").includes("{{proficiency#signed}}")
        ? " + @prof"
        : ` + ${die.fixedValue}`
      : "";
    const globalDamageHints = game.settings.get(SETTINGS.MODULE_ID, "use-damage-hints");
    const scaleValueLink = DDBHelper.getScaleValueString(this.ddbData, this.ddbAction).value;
    const excludedScale = DDBAction.LEVEL_SCALE_EXCLUSION.includes(this.data.name);
    const useScaleValueLink = !excludedScale && scaleValueLink && scaleValueLink !== "{{scalevalue-unknown}}";

    if (die || useScaleValueLink) {
      const damageTag = (globalDamageHints && damageType) ? `[${damageType}]` : "";
      if (useScaleValueLink) {
        this.data.system.damage = {
          parts: [[`${scaleValueLink}${damageTag}${modBonus}${fixedBonus}`, damageType]],
          versatile: "",
        };
      } else if (die.diceString) {
        const profBonus = CONFIG.DDB.levelProficiencyBonuses.find((b) => b.level === this.ddbData.character.classes.reduce((p, c) => p + c.level, 0))?.bonus;
        const replaceProf = this.ddbAction.snippet?.includes("{{proficiency#signed}}")
          && Number.parseInt(die.fixedValue) === Number.parseInt(profBonus);
        const diceString = replaceProf
          ? die.diceString.replace(`+ ${profBonus}`, "")
          : die.diceString;
        const mods = replaceProf ? `${modBonus} + @prof` : modBonus;
        const damageString = utils.parseDiceString(diceString, mods, damageTag).diceString;
        this.data.system.damage = {
          parts: [[damageString, damageType]],
          versatile: "",
        };
      } else if (fixedBonus) {
        this.data.system.damage = {
          parts: [[fixedBonus + modBonus, damageType]],
          versatile: "",
        };
      }
    }
  }

  _generateSaveAttack() {
    this.data.system.actionType = "save";
    this._generateDamage();

    const fixedDC = this.ddbAction.fixedSaveDc ? this.ddbAction.fixedSaveDc : null;
    const scaling = fixedDC ? "flat" : (this.ddbAction.abilityModifierStatId) ? DICTIONARY.character.abilities.find((stat) => stat.id === this.ddbAction.abilityModifierStatId).value : "spell";

    const saveAbility = (this.ddbAction.saveStatId)
      ? DICTIONARY.character.abilities.find((stat) => stat.id === this.ddbAction.saveStatId).value
      : "";

    this.data.system.save = {
      ability: saveAbility,
      dc: fixedDC,
      scaling: scaling,
    };
    if (this.ddbAction.abilityModifierStatId) {
      this.data.system.ability = DICTIONARY.character.abilities.find((stat) => stat.id === this.ddbAction.abilityModifierStatId).value;
    }
  }

  isMartialArtist(klass = null) {
    if (klass) {
      return klass.classFeatures.some((feature) => feature.definition.name === "Martial Arts");
    } else {
      return this.ddbData.character.classes.some((k) => k.classFeatures.some((feature) => feature.definition.name === "Martial Arts"));
    }

  }

  _generateMartialArtsDamage() {
    const damageType = DICTIONARY.actions.damageType.find((type) => type.id === this.ddbAction.damageTypeId).name;
    const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");

    let damageBonus = DDBHelper.filterBaseModifiers(this.ddbData, "damage", { subType: "unarmed-attacks" }).reduce((prev, cur) => prev + cur.value, 0);
    if (damageBonus === 0) {
      damageBonus = "";
    } else {
      damageBonus = ` + ${damageBonus}`;
    }
    const actionDie = this.ddbAction.dice ? this.ddbAction.dice : this.ddbAction.die ? this.ddbAction.die : undefined;

    // are we dealing with martial arts?
    if (this.isMartialArtist()) {
      const dies = this.ddbData.character.classes
        .filter((klass) => this.isMartialArtist([klass]))
        .map((klass) => {
          const feature = klass.classFeatures.find((feature) => feature.definition.name === "Martial Arts");
          const levelScaleDie = feature?.levelScale?.dice ? feature.levelScale.dice : feature?.levelScale.die ? feature.levelScale.die : undefined;

          if (levelScaleDie?.diceString) {

            const scaleValueLink = DDBHelper.getScaleValueLink(this.ddbData, feature);
            const scaleString = scaleValueLink && scaleValueLink !== "{{scalevalue-unknown}}"
              ? scaleValueLink
              : levelScaleDie.diceString;

            if (actionDie?.diceValue > levelScaleDie.diceValue) {
              return actionDie.diceString;
            }
            return scaleString;
          } else if (actionDie !== null && actionDie !== undefined) {
            // On some races bite is considered a martial art, damage
            // is different and on the action itself
            return actionDie.diceString;
          } else {
            return "1";
          }
        });
      const die = dies.length > 0 ? dies[0] : "";
      const damageTag = (globalDamageHints && damageType) ? `[${damageType}]` : "";
      const damageString = die.includes("@")
        ? `${die}${damageTag}${damageBonus} + @mod`
        : utils.parseDiceString(die, `${damageBonus} + @mod`, damageTag).diceString;

      // set the weapon damage
      this.data.system.damage = {
        parts: [[damageString, damageType]],
        versatile: "",
      };
    } else if (actionDie !== null && actionDie !== undefined) {
      // The Lizardfolk jaws have a different base damage, its' detailed in
      // dice so lets capture that for actions if it exists
      const damageTag = (globalDamageHints && damageType) ? `[${damageType}]` : "";
      const damageString = utils.parseDiceString(actionDie.diceString, `${damageBonus} + @mod`, damageTag).diceString;
      this.data.system.damage = {
        parts: [[damageString, damageType]],
        versatile: "",
      };
    } else {
      // default to basics
      this.data.system.damage = {
        parts: [[`1${damageBonus} + @mod`, damageType]],
        versatile: "",
      };
    }
  }

  _calculateActionAttackAbilities() {
    let defaultAbility;

    if (this.ddbAction.abilityModifierStatId && !([1, 2].includes(this.ddbAction.abilityModifierStatId) && this.ddbAction.isMartialArts)) {
      defaultAbility = DICTIONARY.character.abilities.find(
        (stat) => stat.id === this.ddbAction.abilityModifierStatId
      ).value;
      this.data.system.ability = defaultAbility;
    } else if (this.ddbAction.isMartialArts) {
      this.data.system.ability
        = this.ddbAction.isMartialArts && this.isMartialArtist()
          ? this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities.dex.value >= this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities.str.value
            ? "dex"
            : "str"
          : "str";
    } else {
      this.data.system.ability = "";
    }
    if (this.ddbAction.isMartialArts) {
      this._generateMartialArtsDamage();
      this.data.system.attackBonus = DDBHelper.filterBaseModifiers(this.ddbData, "bonus", { subType: "unarmed-attacks" }).reduce((prev, cur) => prev + cur.value, 0);
    } else {
      this._generateDamage();
    }
    return this.data;
  }


  _generateAttackType() {
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    if (typeof this.ddbAction.saveStatId === "number") {
      this._generateSaveAttack();
    } else if (this.ddbAction.actionType === 1) {
      if (this.ddbAction.attackTypeRange === 2) {
        this.data.system.actionType = "rwak";
      } else {
        this.data.system.actionType = "mwak";
      }
      this._calculateActionAttackAbilities();
    } else {
      if (this.ddbAction.rangeId && this.ddbAction.rangeId === 1) {
        this.data.system.actionType = "mwak";
      } else if (this.ddbAction.rangeId && this.ddbAction.rangeId === 2) {
        this.data.system.actionType = "rwak";
      } else {
        this.data.system.actionType = "other";
      }
      this._calculateActionAttackAbilities();
    }
  }

  /**
   * Some features have actions that use dice and mods that are defined on the character class feature
   * this attempts to parse out the damage dice and any ability modifier.
   * This relies on the parsing of templateStrings for the ability modifier detection.
   */
  _generateLevelScaleDice(useScale = true) {
    if (useScale) return;
    const excludedScale = DDBAction.LEVEL_SCALE_EXCLUSION.includes(this.ddbAction.name);
    const parts = this.ddbData.character.classes
      .filter((cls) => cls.classFeatures.some((feature) =>
        feature.definition.id == this.ddbAction.componentId
        && feature.definition.entityTypeId == this.ddbAction.componentTypeId
        && feature.levelScale?.dice?.diceString
      ))
      .map((cls) => {
        const feature = cls.classFeatures.find((feature) =>
          feature.definition.id == this.ddbAction.componentId
          && feature.definition.entityTypeId == this.ddbAction.componentTypeId
        );
        const parsedString = this.rawCharacter.flags.ddbimporter.dndbeyond.templateStrings.find((templateString) =>
          templateString.id == this.ddbAction.id
          && templateString.entityTypeId == this.ddbAction.entityTypeId
        );
        const die = feature.levelScale.dice ? feature.levelScale.dice : feature.levelScale.die ? feature.levelScale.die : undefined;
        const scaleValueLink = DDBHelper.getScaleValueString(this.ddbData, this.ddbAction).value;
        let part = useScale && !excludedScale && scaleValueLink && scaleValueLink !== "{{scalevalue-unknown}}"
          ? scaleValueLink
          : die.diceString;
        if (parsedString) {
          const modifier = parsedString.definitions.find((definition) => definition.type === "modifier");
          if (modifier) {
            this.data.system.ability = modifier.subType;
            part = `${part} + @mod`;
          }
        }
        return [part, ""];
      });

    if (parts.length > 0 && useScale) {
      this.data.system.damage.parts = parts;
    } else if (parts.length > 0 && !DDBAction.LEVEL_SCALE_INFUSIONS.includes(this.ddbAction.name)) {
      const combinedParts = hasProperty(this.data, "data.damage.parts") && this.data.system.damage.parts.length > 0
        ? this.data.system.damage.parts.concat(parts)
        : parts;
      this.data.system.damage = {
        parts: combinedParts,
        versatile: "",
      };
    }
  }

  _generateResourceFlags() {
    const linkItems = game.modules.get("link-item-resource-5e")?.active;
    const resourceType = getProperty(this.rawCharacter, "flags.ddbimporter.resources.type");
    if (resourceType !== "disable" && linkItems) {
      const hasResourceLink = getProperty(this.data.flags, "link-item-resource-5e.resource-link");
      Object.keys(this.rawCharacter.system.resources).forEach((resource) => {
        const detail = this.rawCharacter.system.resources[resource];
        if (this.ddbAction.name === detail.label) {
          setProperty(this.data.flags, "link-item-resource-5e.resource-link", resource);
          this.rawCharacter.system.resources[resource] = { value: 0, max: 0, sr: false, lr: false, label: "" };
        } else if (hasResourceLink === resource) {
          setProperty(this.data.flags, "link-item-resource-5e.resource-link", undefined);
        }
      });
    }
  }

  _generateFlagHints() {
    // obsidian and klass names (used in effect enrichment)
    if (this._actionType.class) {
      const klass = DDBHelper.findClassByFeatureId(this.ddbData, this._actionType.class.componentId);
      setProperty(this.data.flags, "obsidian.source.type", "class");
      setProperty(this.data.flags, "ddbimporter.type", "class");
      setProperty(this.data.flags, "obsidian.source.text", klass.definition.name);
      setProperty(this.data.flags, "ddbimporter.class", klass.definition.name);
      const subClassName = hasProperty(klass, "subclassDefinition.name") ? klass.subclassDefinition.name : undefined;
      setProperty(this.data.flags, "ddbimporter.subclass", subClassName);
    } else if (this._actionType.race) {
      setProperty(this.data.flags, "obsidian.source.type", "race");
      setProperty(this.data.flags, "ddbimporter.type", "race");
    } else if (this._actionType.feat) {
      setProperty(this.data.flags, "obsidian.source.type", "feat");
      setProperty(this.data.flags, "ddbimporter.type", "feat");
    }

    // scaling details
    const klassActionComponent = DDBHelper.findComponentByComponentId(this.ddbData, this.ddbAction.id)
      ?? DDBHelper.findComponentByComponentId(this.ddbData, this.ddbAction.componentId);
    if (klassActionComponent) {
      setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScale", klassActionComponent.levelScale);
      setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScales", klassActionComponent.definition?.levelScales);
      setProperty(this.data.flags, "ddbimporter.dndbeyond.limitedUse", klassActionComponent.definition?.limitedUse);
    }
  }

  _getFeatModifierItem(choice, type) {
    if (this.ddbAction.grantedModifiers) return this.ddbAction;
    let modifierItem = duplicate(this.ddbAction);
    const modifiers = [
      DDBHelper.getChosenClassModifiers(this.ddbData, { includeExcludedEffects: true, effectOnly: true }),
      DDBHelper.getModifiers(this.ddbData, "race", true, true),
      DDBHelper.getModifiers(this.ddbData, "background", true, true),
      DDBHelper.getModifiers(this.ddbData, "feat", true, true),
    ].flat();

    if (!modifierItem.definition) modifierItem.definition = {};
    modifierItem.definition.grantedModifiers = modifiers.filter((mod) => {
      if (mod.componentId === this.ddbAction.definition?.id && mod.componentTypeId === this.ddbAction.definition?.entityTypeId)
        return true;
      if (choice && this.ddbData.character.options[type]?.length > 0) {
        // if it is a choice option, try and see if the mod matches
        const choiceMatch = this.ddbData.character.options[type].some(
          (option) =>
            // id match
            choice.componentId == option.componentId // the choice id matches the option componentID
            && option.definition.id == mod.componentId // option id and mod id match
            && (choice.componentTypeId == option.componentTypeId // either the choice componenttype and optiontype match or
              || choice.componentTypeId == option.definition.entityTypeId) // the choice componentID matches the option definition entitytypeid
            && option.definition.entityTypeId == mod.componentTypeId // mod componentId matches option entity type id
            && choice.id == mod.componentId // choice id and mod id match
        );
        // console.log(`choiceMatch ${choiceMatch}`);
        if (choiceMatch) return true;
      } else if (choice) {
        // && choice.parentChoiceId
        const choiceIdSplit = choice.choiceId.split("-").pop();
        if (mod.id == choiceIdSplit) return true;
      }

      if (mod.componentId === this.ddbAction.id || mod.componentId === this.ddbAction.definition?.id) {
        if (type === "class") {
          // logger.log("Class check - feature effect parsing");
          const classFeatureMatch = this.ddbData.character.classes.some((klass) =>
            klass.classFeatures.some(
              (f) => f.definition.entityTypeId == mod.componentTypeId && f.definition.id == this.ddbAction.id
            )
          );
          if (classFeatureMatch) return true;
        } else if (type === "feat") {
          const featMatch = this.ddbData.character.feats.some(
            (f) => f.definition.entityTypeId == mod.componentTypeId && f.definition.id == this.ddbAction.id
          );
          if (featMatch) return true;
        } else if (type === "race") {
          const traitMatch = this.ddbData.character.race.racialTraits.some(
            (t) =>
              t.definition.entityTypeId == mod.componentTypeId
              && t.definition.id == mod.componentId
              && t.definition.id == this.ddbAction.definition.id
          );
          if (traitMatch) return true;
        }
      }
      return false;
    });
    // console.warn("Modifier Item", modifierItem);
    return modifierItem;
  }

  _addFeatEffects(choice, type) {
    // can we apply any effects to this feature
    const daeInstalled = game.modules.get("dae")?.active;
    const compendiumItem = this.rawCharacter.flags.ddbimporter.compendium;
    const addCharacterEffects = compendiumItem
      ? game.settings.get("ddb-importer", "munching-policy-add-effects")
      : game.settings.get("ddb-importer", "character-update-policy-add-character-effects");
    const modifierItem = this._getFeatModifierItem(choice, type);
    if (daeInstalled && addCharacterEffects) {
      this.data = generateEffects(this.ddbData, this.rawCharacter, modifierItem, this.data, compendiumItem, "feat");
      // console.log(item);
    } else {
      this.data = generateBaseACItemEffect(this.ddbData, this.rawCharacter, modifierItem, this.data, compendiumItem);
    }

  }


  _addCustomValues() {
    DDBHelper.addCustomValues(this.ddbData, this.data);
  }

  _generateWeaponType() {
    const entry = DICTIONARY.actions.attackTypes.find((type) => type.attackSubtype === this.ddbAction.attackSubtype);
    const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === this.ddbAction.attackTypeRange);
    this.data.system.weaponType = entry
      ? entry.value
      : range
        ? `simple${range.value}`
        : "simpleM";
  }

  _generateProperties() {

    const kiEmpowered = this.ddbData.character.classes
      // is a martial artist
      .some((cls) =>
        cls.classFeatures.some((feature) =>
          feature.definition.name === "Ki-Empowered Strikes"
          && cls.level >= feature.definition.requiredLevel
        ));

    if (kiEmpowered && getProperty(this.data, "flags.ddbimporter.originalName") == "Unarmed Strike") {
      setProperty(this.data, "system.properties.mgc", true);
    }

  }

}
