import { DICTIONARY } from "../../config/_module";
import {
  utils,
  logger,
  DDBItemImporter,
  DDBCompendiumFolders,
  DDBSources,
} from "../../lib/_module";
import {
  Effects,
  DDBClassFeatureEnricher,
} from "../enrichers/_module";
import { DDBBasicActivity } from "../activities/_module";
import { DDBFeatureActivity } from "../activities/_module";
import DDBAction from "./DDBAction";
import DDBAttackAction from "./DDBAttackAction";
import { DDBTemplateStrings, DDBReferenceLinker, DDBModifiers, DDBDataUtils, SystemHelpers } from "../lib/_module";

export type IDDBSupportedInfusionDocuments = I5eFeatItem | I5eWeaponItem | I5eEquipmentItem;

export interface IDDBInfusionItemMock {
  definition: {
    name: string;
    grantedModifiers: IDDBModifier[];
  };
}

interface IDDBInfusion {
  ddbData: IDDBData;
  ddbInfusion: IDDBInfusionDefinition;
  documentType?: "feat" | "weapon" | "equipment";
  rawCharacter?: I5ePCData | null;
  isMuncher?: boolean;
  addToCompendium?: boolean;
  nameIdPostfix?: string | null;
}

export class DDBInfusion {
  ddbData: IDDBData;
  ddbInfusion: IDDBInfusionDefinition;
  documentType: "feat" | "weapon" | "equipment";
  rawCharacter: I5ePCData | null;
  name: string;
  data: IDDBSupportedInfusionDocuments;
  nameIdPostfix: string | null;
  requiredLevel: number | null;
  originClass: string;
  tagType: string;
  type: string;
  isAction: boolean;
  isMuncher: boolean;
  snippet = "";
  addToCompendium: boolean;
  activity: DDBBasicActivity;
  enricher: DDBClassFeatureEnricher;
  activityType: IDDBActivityType;
  compendiumFolders: DDBCompendiumFolders;
  actions: IDDBSupportedInfusionDocuments[];
  actionsToAddToCompendium: IDDBSupportedInfusionDocuments[];

  _init() {
    logger.debug(`Generating Infusion Feature ${this.ddbInfusion.name}`);
  }

  _generateDataStub() {

    this.data = {
      _id: utils.namedIDStub(this.name, { postfix: this.nameIdPostfix }),
      name: utils.nameString(`Infusion: ${this.name}`),
      type: this.documentType,
      system: SystemHelpers.getTemplate(this.documentType),
      effects: [],
      flags: {
        ddbimporter: {
          id: this.ddbInfusion.id,
          infusionId: this.ddbInfusion.id,
          class: this.originClass,
          infusionFeature: true,
          type: this.tagType,
          dndbeyond: {
            defintionKey: this.ddbInfusion.definitionKey,
            requiredLevel: this.ddbInfusion.level,
            modifierType: this.ddbInfusion.modifierDataType,
            type: this.ddbInfusion.type,
            requiresAttunement: this.ddbInfusion.requiresAttunement,
            allowDuplicates: this.ddbInfusion.allowDuplicates,
          },
        },
      },
    };

    this.requiredLevel = null;
    const requiredLevel = foundry.utils.getProperty(this.ddbInfusion, "level") as string;
    if (Number.isInteger(Number.parseInt(requiredLevel))) {
      foundry.utils.setProperty(this.data, "system.prerequisites.level", Number.parseInt(requiredLevel));
      this.requiredLevel = Number.parseInt(requiredLevel);
    }

    this.data.system.source = DDBSources.parseSource(this.ddbInfusion);
    this.data.system.source.rules = "2014";

    if (this.requiredLevel && this.requiredLevel > 1 && "requirements" in this.data.system) {
      this.data.system.requirements = ` ${utils.ordinalSuffixOf(this.requiredLevel)}-level ${this.originClass}`;
    }
  }

  _getActivityType() {
    if (["augment", "replicate"].includes(this.ddbInfusion.type)) {
      return "enchant";
    } else if (this.ddbInfusion.type === "creature") {
      return "summon";
    }
    return undefined;
  }

  constructor({ ddbData, ddbInfusion, documentType = "feat" as const, rawCharacter = null, isMuncher = false, addToCompendium = true, nameIdPostfix = null }: IDDBInfusion) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.ddbInfusion = ddbInfusion;
    this.name = utils.nameString(this.ddbInfusion.name);
    this.type = "feat";
    this.originClass = "Artificer";
    this.isAction = false;
    this.documentType = documentType;
    this.tagType = "infusion";
    this.actions = [];
    this.actionsToAddToCompendium = [];
    // this.grantedItems = [];
    this.isMuncher = isMuncher;
    // this.idNames = [];
    // this.compendium = null;
    this._init();
    this._generateDataStub();
    this.addToCompendium = addToCompendium;
    this.nameIdPostfix = nameIdPostfix;
    this.activityType = this._getActivityType();
    this.enricher = new DDBClassFeatureEnricher({
      activityGenerator: DDBFeatureActivity,
      fallbackEnricher: "Generic",
    });
  }

  _buildBaseActivity() {
    this.activity = new DDBBasicActivity({
      type: this.activityType,
      actor: this.rawCharacter,
      foundryFeature: this.data,
    });
    this.activity.data.consumption.targets = [
      {
        type: "itemUses",
        target: "", // adjusted later
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      },
    ];

    this.activity.data.restrictions = {
      type: "",
      allowMagical: false,
    };

    if (this.activityType === "summon") {
      this.activity.data.activation.type = "action";
      this.activity.data.activation.value = 1;
    }

  }

  _buildDescription() {
    this.snippet = this.ddbInfusion.snippet ? this.ddbInfusion.snippet : "";
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
    const itemText = foundry.utils.getProperty(this.ddbInfusion, "itemRuleData.text");
    const prerequisitesHeader = this.requiredLevel && this.requiredLevel > 1
      ? `<p><i>Prerequisites: ${utils.ordinalSuffixOf(this.requiredLevel)}-level ${this.originClass}</i></p>`
      : "";
    const itemHeader = itemText
      ? `<p><i>Item: ${itemText}</i></p>`
      : "";

    const valueDamageText = DDBReferenceLinker.parseDamageRolls({ text: this.ddbInfusion.description, document: this.data, actor: null });
    const chatDamageText = chatAdd ? DDBReferenceLinker.parseDamageRolls({ text: this.snippet, document: this.data, actor: null }) : "";
    this.data.system.description = {
      value: DDBReferenceLinker.parseTags(prerequisitesHeader + itemHeader + valueDamageText),
      chat: chatAdd ? DDBReferenceLinker.parseTags(chatDamageText) : "",
    };

    const repeatableRegex = /<strong>Repeatable\.<\/strong>/i;
    if (repeatableRegex.test(this.data.system.description.value)) {
      foundry.utils.setProperty(this.data, "system.prerequisites.repeatable", true);
    }
  }

  _generateSystemType() {
    foundry.utils.setProperty(this.data, "system.type.value", "enchantment");
    foundry.utils.setProperty(this.data, "system.type.subtype", `${this.originClass.toLowerCase()}Infusion`);
  }

  _generateEnchantmentType() {
    if (this.ddbInfusion.type === "replicate") {
      foundry.utils.setProperty(this.activity, "data.restrictions.allowMagical", true);
    }
    let type = "";
    const itemRule = foundry.utils.getProperty(this.ddbInfusion, "itemRuleData.text") as string;
    if (!itemRule) return;
    if (itemRule.includes("weapon")) type = "weapon";
    else if (itemRule.includes("armor")) type = "equipment";
    else if (itemRule.includes("shield")) type = "equipment";
    else if (itemRule.includes("gem")) type = "loot";
    // tool, equipment, consumable, loot, container, weapon
    foundry.utils.setProperty(this.activity, "data.restrictions.type", type);
  }

  async compendiumInit() {
    this.compendiumFolders = new DDBCompendiumFolders("features");
    await this.compendiumFolders.loadCompendium("features");
    await this.compendiumFolders.createClassFeatureFolder(this.originClass, this.data.system.source.rules);
  }

  async addInfusionsToCompendium(documents) {
    const handlerOptions = {
      chrisPremades: false,
      deleteBeforeUpdate: false,
      filterDuplicates: false,
      matchFlags: ["infusionId"],
      useCompendiumFolders: true,
    };

    logger.debug(`Creating infusion compendium feature`, {
      documents,
      handlerOptions,
      addToCompendium: this.addToCompendium,
      this: this,
    });
    const featureHandler = this.addToCompendium
      ? await DDBItemImporter.buildHandler("features", documents, true, handlerOptions)
      : new DDBItemImporter("features", documents, handlerOptions);
    await featureHandler.buildIndex({
      fields: [
        "name",
        "flags.ddbimporter.classId",
        "flags.ddbimporter.class",
        "flags.ddbimporter.subClass",
        "flags.ddbimporter.subClassId",
        "flags.ddbimporter.originalName",
        "flags.ddbimporter.infusionId",
      ],
    });
    const compendiumFeatures = await featureHandler.compendiumIndex.filter((i) =>
      featureHandler.documents.some((orig) => i.name === orig.name),
    );
    return compendiumFeatures;
  }

  async _buildActions() {
    // build actions for this.ddbInfusion.actions
    // for example radiant weapon reaction
    if (!this.ddbInfusion.actions) return;

    for (const actionData of this.ddbInfusion.actions) {
      // const itemLookup = ddb.infusions.item.find((mapping) => mapping.definitionKey === infusionDetail.definitionKey);
      if (!actionData.name) {
        const activationType = foundry.utils.getProperty(actionData, "activation.activationType") as number;
        const postfix = [3, 4].includes(activationType)
          ? ` (${utils.capitalize(DICTIONARY.actions.activationTypes.find((a) => a.id === activationType).value)})`
          : "";
        actionData.name = `${this.name}${postfix}`;
      }
      const action = DDBDataUtils.displayAsAttack(this.ddbData, actionData, this.rawCharacter)
        ? new DDBAttackAction({
          ddbData: this.ddbData,
          ddbDefinition: actionData,
          rawCharacter: this.rawCharacter,
          type: actionData.actionSource,
          enricher: this.enricher,
          usesOnActivity: true,
          isMuncher: this.isMuncher,
        })
        : new DDBAction({
          ddbData: this.ddbData,
          ddbDefinition: actionData,
          rawCharacter: this.rawCharacter,
          enricher: this.enricher,
          usesOnActivity: true,
          isMuncher: this.isMuncher,
        });
      await action.loadEnricher();
      await action.build();
      foundry.utils.setProperty(action.data, "flags.ddbimporter.class", this.originClass);
      foundry.utils.setProperty(action.data, "flags.ddbimporter.infusionFeature", true);
      foundry.utils.setProperty(action.data, "flags.ddbimporter.infusionId", actionData.id);
      action.data._id = utils.namedIDStub(actionData.name);
      // these factories can
      this.actions.push(action.data as (I5eFeatItem | I5eWeaponItem | I5eEquipmentItem));
    }
    logger.debug(`Generated Infusions Actions`, this.actions);
  }

  async _addActionsToEffects() {
    if (this.actions.length === 0) return;

    for (const actionItem of this.actions) {
      const ids = Object.keys(actionItem.system.activities).map((i) => i);
      if (this.activity.data.effects?.length > 0) {
        this.activity.data.effects[0].riders.activity.push(ids);
      } else {
        this.actionsToAddToCompendium.push(actionItem);
      }
      for (const id of ids) {
        this.data.system.activities[id] = actionItem.system.activities[id];
        this.data.effects.push(...actionItem.effects);
      }
    }

    if (this.actionsToAddToCompendium.length === 0) return;
    const cItems = await this.addInfusionsToCompendium(this.actionsToAddToCompendium);
    if (cItems.length === 0) return;

    const descriptions = this.ddbInfusion.actions.map((i) => `[[/item ${i.name}]]`);

    const uuids = cItems.map((i) => i.uuid);
    // for now just add riders to first effect
    if (this.activity.data.effects?.length > 0)
      this.activity.data.effects[0].riders.item = uuids;
    this.data.effects.forEach((e) => {
      // if (e.flags.ddbimporter?.infusion) e.flags.dnd5e.enchantment.riders.item.push(...uuids);
      e.changes.push({
        key: "system.description.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: `<hr><h2>Infusion Actions</h2><p> ${descriptions.join(", ")} </p>`,
        priority: 20,
      });
    });
  }

  _specials() {
    // handle special cases
    // e.g. radiant weapon blindness effect

    switch (this.name) {
      // example
      case "Radiant Weapon": {
        break;
      }
      // no default
    }


    for (let action of this.actions) {
      const name = foundry.utils.getProperty(action, "flags.ddbimporter.originalName") ?? action.name;
      switch (name) {
        case "Radiant Weapon (Reaction)": {
          action = Effects.AutoEffects.addSimpleConditionEffect(action, "Blinded", { transfer: false });
          break;
        }
        // no default
      }
    }

  }

  _getEnchantmentEffect(modifierData, { useModifierLabelName = false, useOrigin = false } = {}) {
    const label = modifierData.name ?? this.name;
    const foundryItem = foundry.utils.deepClone(this.data);
    foundryItem.effects = [];
    const effect = Effects.EnchantmentEffects.EnchantmentEffect(foundryItem, label, {
      origin: useOrigin ? `Item.${this.data._id}` : null,
    });
    effect.flags.ddbimporter.infusion = true;
    const modifiers = foundry.utils.deepClone(modifierData.modifiers) ?? [];
    const modifierItem : IDDBInfusionItemMock = {
      definition: {
        name: this.name,
        grantedModifiers: modifiers.filter((mod) =>
          !(mod.type === "bonus" && mod.subType === "armor-class")
          && !(mod.type === "bonus" && mod.subType === "magic"),
        ),
      },
    };

    const mockItem = Effects.EffectGenerator.generateEffects({
      ddb: this.ddbData,
      character: this.rawCharacter,
      // @ts-expect-error - TODO, revisit this and abstract out an effects interface across the various items
      ddbItem: modifierItem,
      document: foundryItem,
      isCompendiumItem: false, // isGeneric or isMuncher
      type: "infusion",
      description: this.snippet,
    });
    if (mockItem.effects.length > 0) effect.changes = mockItem.effects.map((e) => e.changes).flat(1);

    effect.changes.push(...this._getMagicBonusChanges(modifiers));

    if (this.ddbInfusion.requiresAttunement) {
      effect.changes.push({
        key: "system.attunement",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: "required",
        priority: 20,
      });
    }

    const nameLabel = this.ddbInfusion.type === "replicate"
      ? `: Replicated [Infusion]`
      : `: ${useModifierLabelName ? label : this.name} [Infusion]`;
    effect.changes.push(
      {
        key: "name",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: nameLabel,
        priority: 20,
      },
    );
    return effect;
  }

  _generateEnchantmentStubEffect() {
    const useModifierLabelName = ["damage-type-choice"].includes(this.ddbInfusion.modifierDataType);
    const effect = this._getEnchantmentEffect([], {
      useModifierLabelName,
    });
    const effectLink = {
      _id: effect._id,
      level: {
        min: null,
        max: null,
      },
      riders: {
        activity: [],
        effect: [],
        item: [],
      },
    };
    this.activity.data.effects.push(effectLink);
    this.data.effects.push(effect);
  }

  _addDescriptionToEffect(effect) {
    const description = DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, this.ddbInfusion.description, this.ddbInfusion).text;
    effect.changes.push({
      key: "system.description.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: `<hr> <h5>Infusion Details</h5>${description}`,
    });
  }

  _generateEnchantmentEffects() {
    const useModifierLabelName = ["damage-type-choice"].includes(this.ddbInfusion.modifierDataType);
    for (const [index, effectData] of this.ddbInfusion.modifierData.entries()) {
      const effect = this._getEnchantmentEffect(effectData, {
        useModifierLabelName,
      });

      const effectLink = {
        _id: effect._id,
        level: {
          min: null,
          max: null,
        },
        riders: {
          activity: [],
          effect: [],
          item: [],
        },
      };

      const description = DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, this.ddbInfusion.snippet, this.ddbInfusion).text;

      switch (this.ddbInfusion.modifierDataType) {
        case "class-level": {
          const minLevel = effectData.value;
          const maxLevel = index < (this.ddbInfusion.modifierData.length - 1)
            ? (this.ddbInfusion.modifierData[index + 1].value ?? null) - 1
            : null;
          effectLink.level = {
            min: minLevel,
            max: maxLevel,
          };
          // foundry.utils.setProperty(effect, "flags.dnd5e.enchantment.level", effectLink.level);
          effect.description = description;
          this._addDescriptionToEffect(effect);
          break;
        }
        case "granted": {
          effect.description = description;
          this._addDescriptionToEffect(effect);
          break;
        }
        case "damage-type-choice": {
          effect.description = description;
          this._addDescriptionToEffect(effect);
          break;
        }
        default: {
          this._addDescriptionToEffect(effect);
          logger.debug(`Infusion ${this.name} has no additional config`);
        }
      }

      this.activity.data.effects.push(effectLink);
      this.data.effects.push(effect);
    }

  }

  _getMagicBonusChanges(modifiers) {
    const filteredModifiers = DDBModifiers.filterModifiersOld(modifiers, "bonus", "magic");
    const magicBonus = DDBModifiers.getModifierSum(filteredModifiers, this.rawCharacter);

    const acFilteredModifiers = DDBModifiers.filterModifiersOld(modifiers, "bonus", "armor-class");
    const acMagicalBonus = DDBModifiers.getModifierSum(acFilteredModifiers, this.rawCharacter);

    const changes = [];
    if (magicBonus && magicBonus !== "") {
      changes.push(
        {
          key: "system.magicalBonus",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: magicBonus,
          priority: 20,
        },
      );
    }
    if (acMagicalBonus && acMagicalBonus !== "") {
      changes.push(
        {
          key: "system.armor.magicalBonus",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: acMagicalBonus,
          priority: 20,
        },
      );
    }

    // all items infused become magical
    changes.push({
      key: "system.properties",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "mgc",
      priority: 20,
    });
    return changes;
  }

  _generateEnchantments() {
    if (this.activityType !== "enchant") return;

    this._generateEnchantmentEffects();

    switch (this.ddbInfusion.modifierDataType) {
      case "granted":
      default: {
        if (this.data.effects.length === 0) this._generateEnchantmentStubEffect();
      }
    }
  }

  // _generateSummons() {
  //   // summons are generated elsewhere and linked to the feature, not handled her.
  // }

  async build() {
    await this.compendiumInit();
    this._buildDescription();
    this._buildBaseActivity();
    this._generateSystemType();
    this._generateEnchantmentType();

    this._generateEnchantments();
    await this.enricher.init();
    await this._buildActions();
    this._specials();
    await this._addActionsToEffects();

    foundry.utils.setProperty(this.data, `system.activities.${this.activity.data._id}`, this.activity.data);

    await this.addInfusionsToCompendium([this.data]);

    logger.debug(`DDBInfusions for ${this.name}`, {
      data: foundry.utils.deepClone(this.data),
      actions: foundry.utils.deepClone(this.actions),
      this: this,
    });
  }

}
