import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import { generateEffects } from "../../effects/effects.js";


export default class DDBBaseFeature {

  _init() {
    logger.debug(`Generating Base Feature ${this.ddbDefinition.name}`);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: DDBHelper.getName(this.ddbData, this.ddbDefinition, this.rawCharacter),
      type: this.documentType,
      system: utils.getTemplate(this.documentType),
      flags: {
        ddbimporter: {
          id: this.ddbDefinition.id,
          entityTypeId: this.ddbDefinition.entityTypeId,
          action: this.isAction,
          componentId: this.ddbDefinition.componentId,
          componentTypeId: this.ddbDefinition.componentTypeId,
          originalName: DDBHelper.getName(this.ddbData, this.ddbDefinition, this.rawCharacter, false),
          type: this.tagType,
          isCustomAction: this.ddbDefinition.isCustomAction,
        },
        infusions: { infused: false },
        obsidian: {
          source: {
            type: this.tagType,
          },
        }
      },
    };
  }

  _prepare() {
    if (this.ddbDefinition.infusionFlags) {
      foundry.utils.setProperty(this.data, "flags.infusions", this.ddbDefinition.infusionFlags);
    }
  }

  constructor({ ddbData, ddbDefinition, type, source, documentType = "feat", rawCharacter = null, noMods = false } = {}) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.ddbFeature = ddbDefinition;
    this.ddbDefinition = ddbDefinition.definition ?? ddbDefinition;
    this.name = utils.nameString(this.ddbDefinition.name);
    this.type = type;
    this.source = source;
    this.isAction = false;
    this.documentType = documentType;
    this.tagType = "other";
    this.data = {};
    this.noMods = noMods;
    this._init();

    // this._attacksAsFeatures = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-actions-as-features");

    this._generateDataStub();
    this._prepare();
    this.data.system.source = this.source;
  }

  _generateActivation() {
    if (!this.ddbDefinition.activation) return;
    const actionType = DICTIONARY.actions.activationTypes
      .find((type) => type.id === this.ddbDefinition.activation.activationType);
    const activation = !actionType
      ? {}
      : {
        type: actionType.value,
        cost: this.ddbDefinition.activation.activationTime || 1,
        condition: "",
      };
    this.data.system.activation = activation;
  }

  _getClassFeatureDescription() {
    if (!this.ddbData) return "";
    const componentId = this.ddbDefinition.componentId;
    const componentTypeId = this.ddbDefinition.componentTypeId;

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
        return parseTemplateString(this.ddbData, this.rawCharacter, feature.definition.description, this.ddbFeature).text;
      }
    }
    return "";
  }


  _getRaceFeatureDescription() {
    const componentId = this.ddbDefinition.componentId;
    const componentTypeId = this.ddbDefinition.componentTypeId;

    const feature = this.ddbData.character.race.racialTraits
      .find((trait) =>
        trait.definition.id == componentId
        && trait.definition.entityTypeId == componentTypeId
      );

    if (feature) {
      return parseTemplateString(this.ddbData, this.rawCharacter, feature.definition.description, this.ddbFeature).text;
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

    const rawSnippet = this.ddbDefinition.snippet
      ? parseTemplateString(this.ddbData, this.rawCharacter, this.ddbDefinition.snippet, this.ddbFeature).text
      : "";

    const description = this.ddbDefinition.description && this.ddbDefinition.description !== ""
      ? parseTemplateString(this.ddbData, this.rawCharacter, this.ddbDefinition.description, this.ddbFeature).text
      : this.type === "race"
        ? this._getRaceFeatureDescription()
        : this._getClassFeatureDescription();

    if (!chatAdd) {
      const snippet = utils.stringKindaEqual(description, rawSnippet) ? "" : rawSnippet;
      const fullDescription = DDBBaseFeature.buildFullDescription(description, snippet);
      const value = !useFull && snippet.trim() !== "" ? snippet : fullDescription;

      this.data.system.description = {
        value: value,
        chat: chatAdd ? snippet : "",
      };
    } else {
      const snippet = description !== "" && utils.stringKindaEqual(description, rawSnippet) ? "" : rawSnippet;

      this.data.system.description = {
        value: description,
        chat: snippet,
      };
    }

  }

  // eslint-disable-next-line complexity
  _generateLimitedUse() {
    if (
      this.ddbDefinition.limitedUse
      && (this.ddbDefinition.limitedUse.maxUses || this.ddbDefinition.limitedUse.statModifierUsesId || this.ddbDefinition.limitedUse.useProficiencyBonus)
    ) {
      const resetType = DICTIONARY.resets.find((type) => type.id === this.ddbDefinition.limitedUse.resetType);
      let maxUses = (this.ddbDefinition.limitedUse.maxUses && this.ddbDefinition.limitedUse.maxUses !== -1) ? this.ddbDefinition.limitedUse.maxUses : 0;
      let intMaxUses = maxUses;
      const statModifierUsesId = foundry.utils.getProperty(this.ddbDefinition, "limitedUse.statModifierUsesId");
      if (statModifierUsesId) {
        const ability = DICTIONARY.character.abilities.find((ability) => ability.id === statModifierUsesId).value;

        if (maxUses === 0) {
          maxUses = `@abilities.${ability}.mod`;
          intMaxUses = this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
        } else {
          switch (this.ddbDefinition.limitedUse.operator) {
            case 2:
              maxUses = `${maxUses} * @abilities.${ability}.mod`;
              intMaxUses *= this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
              break;
            case 1:
            default:
              maxUses = `${maxUses} + @abilities.${ability}.mod`;
              intMaxUses += this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
          }
        }
      }

      const useProficiencyBonus = foundry.utils.getProperty(this.ddbDefinition, "limitedUse.useProficiencyBonus");
      if (useProficiencyBonus) {
        if (maxUses === 0) {
          maxUses = `@prof`;
          intMaxUses = this.rawCharacter.flags.ddbimporter.dndbeyond.profBonus;
        } else {
          switch (this.ddbDefinition.limitedUse.proficiencyBonusOperator) {
            case 2:
              maxUses = `${maxUses} * @prof`;
              intMaxUses *= this.rawCharacter.flags.ddbimporter.dndbeyond.profBonus;
              break;
            case 1:
            default:
              maxUses = `${maxUses} + @prof`;
              intMaxUses += this.rawCharacter.flags.ddbimporter.dndbeyond.profBonus;
          }
        }
      }

      const finalMaxUses = (maxUses)
        ? Number.isInteger(maxUses)
          ? parseInt(maxUses)
          : maxUses
        : null;

      intMaxUses = Number.isInteger(intMaxUses) ? parseInt(intMaxUses) : null;

      this.data.system.uses = {
        value: (intMaxUses !== null && intMaxUses != 0) ? intMaxUses - this.ddbDefinition.limitedUse.numberUsed : null,
        max: (finalMaxUses != 0) ? finalMaxUses : null,
        per: resetType ? resetType.value : "",
      };
    }
  }

  _generateResourceConsumption() {
    if (!this.rawCharacter) return;

    Object.keys(this.rawCharacter.system.resources).forEach((resource) => {
      const detail = this.rawCharacter.system.resources[resource];
      if (this.ddbDefinition.name === detail.label) {
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
      foundry.utils.setProperty(this.data, "system.consume.amount", match[1]);
    }

  }

  _generateRange() {
    if (this.ddbDefinition.range && this.ddbDefinition.range.aoeType && this.ddbDefinition.range.aoeSize) {
      this.data.system.range = { value: null, units: "self", long: "" };
      this.data.system.target = {
        value: this.ddbDefinition.range.aoeSize,
        type: DICTIONARY.actions.aoeType.find((type) => type.id === this.ddbDefinition.range.aoeType)?.value,
        units: "ft",
      };
    } else if (this.ddbDefinition.range && this.ddbDefinition.range.range) {
      this.data.system.range = {
        value: this.ddbDefinition.range.range,
        units: "ft",
        long: this.ddbDefinition.range.long || "",
      };
    } else {
      this.data.system.range = { value: 5, units: "ft", long: "" };
    }
  }

  isMartialArtist(klass = null) {
    if (klass) {
      return klass.classFeatures.some((feature) => feature.definition.name === "Martial Arts");
    } else {
      return this.ddbData.character.classes.some((k) => k.classFeatures.some((feature) => feature.definition.name === "Martial Arts"));
    }

  }

  _generateResourceFlags() {
    const linkItems = game.modules.get("link-item-resource-5e")?.active;
    const resourceType = foundry.utils.getProperty(this.rawCharacter, "flags.ddbimporter.resources.type");
    if (resourceType !== "disable" && linkItems) {
      const hasResourceLink = foundry.utils.getProperty(this.data.flags, "link-item-resource-5e.resource-link");
      Object.keys(this.rawCharacter.system.resources).forEach((resource) => {
        const detail = this.rawCharacter.system.resources[resource];
        if (this.ddbDefinition.name === detail.label) {
          foundry.utils.setProperty(this.data.flags, "link-item-resource-5e.resource-link", resource);
          this.rawCharacter.system.resources[resource] = { value: 0, max: 0, sr: false, lr: false, label: "" };
        } else if (hasResourceLink === resource) {
          foundry.utils.setProperty(this.data.flags, "link-item-resource-5e.resource-link", undefined);
        }
      });
    }
  }

  _getFeatModifierItem(choice, type) {
    if (this.ddbDefinition.grantedModifiers) return this.ddbDefinition;
    let modifierItem = foundry.utils.duplicate(this.ddbDefinition);
    const modifiers = [
      DDBHelper.getChosenClassModifiers(this.ddbData, { includeExcludedEffects: true, effectOnly: true }),
      DDBHelper.getModifiers(this.ddbData, "race", true, true),
      DDBHelper.getModifiers(this.ddbData, "background", true, true),
      DDBHelper.getModifiers(this.ddbData, "feat", true, true),
    ].flat();

    if (!modifierItem.definition) modifierItem.definition = {};
    modifierItem.definition.grantedModifiers = modifiers.filter((mod) => {
      if (mod.componentId === this.ddbDefinition?.id && mod.componentTypeId === this.ddbDefinition?.entityTypeId)
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

      if (mod.componentId === this.ddbDefinition.id) {
        if (type === "class") {
          // logger.log("Class check - feature effect parsing");
          const classFeatureMatch = this.ddbData.character.classes.some((klass) =>
            klass.classFeatures.some(
              (f) => f.definition.entityTypeId == mod.componentTypeId && f.definition.id == this.ddbDefinition.id
            )
          );
          if (classFeatureMatch) return true;
        } else if (type === "feat") {
          const featMatch = this.ddbData.character.feats.some(
            (f) => f.definition.entityTypeId == mod.componentTypeId && f.definition.id == this.ddbDefinition.id
          );
          if (featMatch) return true;
        } else if (type === "race") {
          const traitMatch = this.ddbData.character.race.racialTraits.some(
            (t) =>
              t.definition.entityTypeId == mod.componentTypeId
              && t.definition.id == mod.componentId
              && t.definition.id == this.ddbDefinition.id
          );
          if (traitMatch) return true;
        }
      }
      return false;
    });
    // console.warn("Modifier Item", modifierItem);
    return modifierItem;
  }

  _addEffects(choice, type) {
    // can we apply any auto-generated effects to this feature
    const compendiumItem = this.rawCharacter.flags.ddbimporter.compendium;
    const modifierItem = this._getFeatModifierItem(choice, type);
    this.data = generateEffects(this.ddbData, this.rawCharacter, modifierItem, this.data, compendiumItem, "feat");
  }


  _addCustomValues() {
    DDBHelper.addCustomValues(this.ddbData, this.data);
  }

  _generateSystemSubType() {
    if (this.type === "class") {
      let subType = null;
      if (this.data.name.startsWith("Ki:")) subType = "Ki";
      // many ki abilities do not start with ki
      else if (this.data.name.startsWith("Channel Divinity:")) subType = "channelDivinity";
      else if (this.data.name.startsWith("Artificer Infusion:")) subType = "artificerInfusion";
      else if (this.data.name.startsWith("Invocation:")) subType = "eldritchInvocation";
      else if (this.data.name.startsWith("Fighting Style:")) subType = "fightingStyle";
      else if (this.data.name.startsWith("Battle Master Maneuver:")) subType = "maneuver";
      else if (this.data.name.startsWith("Metamagic:")) subType = "metamagic";
      else if (this.data.name.startsWith("Pact of the")) subType = "pact";
      else if (this.data.name.startsWith("Rune Carver:")) subType = "rune";
      else if (this.data.name.startsWith("Psionic Power:")) subType = "psionicPower";
      else if (this.data.name.startsWith("Hunter's Prey:")) subType = "huntersPrey";
      else if (this.data.name.startsWith("Defensive Tactics:")) subType = "defensiveTactic";
      else if (this.data.name.startsWith("Superior Hunter's Defense:")) subType = "superiorHuntersDefense";
      else if (this.data.name.startsWith("Arcane Shot Options:")) subType = "arcaneShot";
      else if (this.data.name.startsWith("Elemental Disciplines:")) subType = "elementalDiscipline";
      // missing: Arcane Shot : arcaneShot
      // missing: multiattack

      if (subType) foundry.utils.setProperty(this.data, "system.type.subtype", subType);
    }
  }

  _generateSystemType() {
    foundry.utils.setProperty(this.data, "system.type.value", this.type);
  }

  // eslint-disable-next-line class-methods-use-this
  build() {
    // override this feature
    return false;
  }

}
