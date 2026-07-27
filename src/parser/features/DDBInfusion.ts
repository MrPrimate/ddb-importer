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
import ChangeHelper from "../enrichers/effects/ChangeHelper";

export type IDDBSupportedInfusionDocuments = I5eFeatItem | I5eWeaponItem | I5eEquipmentItem;

export interface IDDBInfusionItemMock {
  definition: {
    name: string;
    grantedModifiers: IDDBInfusionModifier[];
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
  // the data stub always initialises effects; assigned by _generateDataStub()
  // in the constructor
  data!: IDDBSupportedInfusionDocuments & { effects: I5eEffectData[] };
  nameIdPostfix: string | null;
  requiredLevel: number | null = null;
  originClass: string;
  tagType: string;
  type: string;
  isAction: boolean;
  isMuncher: boolean;
  snippet = "";
  addToCompendium: boolean;
  // created by _buildBaseActivity() before any activity read
  activity!: DDBBasicActivity;
  enricher: DDBClassFeatureEnricher;
  activityType: IDDBActivityType | undefined;
  // created in the compendium folder step before any read
  compendiumFolders!: DDBCompendiumFolders;
  actions: IDDBSupportedInfusionDocuments[];
  actionsToAddToCompendium: IDDBSupportedInfusionDocuments[];

  // runtime callers always supply a raw character (infusions are parsed from a
  // character's data); the constructor default is null for API convenience only
  get _character(): I5ePCData {
    return this.rawCharacter as I5ePCData;
  }

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
          id: Number(this.ddbInfusion.id),
          infusionId: Number(this.ddbInfusion.id),
          class: this.originClass,
          infusionFeature: true,
          type: this.tagType,
          dndbeyond: {
            defintionKey: this.ddbInfusion.definitionKey,
            requiredLevel: this.ddbInfusion.level,
            // DDB uses null for an unset value; the flag type declares optional
            // only, keep the runtime null value unchanged
            modifierType: this.ddbInfusion.modifierDataType as string | undefined,
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

    const localSource = DDBSources.parseSource(this.ddbInfusion);

    this.data.system.source = localSource;
    this.data.system.source.rules = "2014";
    foundry.utils.setProperty(this.data, "flags.ddbimporter.sourceId", localSource.id);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.sourceCategory", localSource.sourceCategoryId);

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
      // DDB infusion types are always augment/replicate/creature, so this is set
      type: this.activityType as IDDBActivityType,
      actor: this.rawCharacter,
      foundryFeature: this.data,
    });
    this.activity.data.consumption ??= {};
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

    if ("restrictions" in this.activity.data) {
      this.activity.data.restrictions = {
        type: "",
        allowMagical: false,
      };
    }

    if (this.activityType === "summon") {
      this.activity.data.activation ??= {};
      this.activity.data.activation.type = "action";
      this.activity.data.activation.value = 1;
    }

  }

  _buildDescription() {
    this.snippet = this.ddbInfusion.snippet ? this.ddbInfusion.snippet : "";
    const chatAdd = utils.getSetting<boolean>("add-description-to-chat");
    const itemText = foundry.utils.getProperty(this.ddbInfusion, "itemRuleData.text");
    const prerequisitesHeader = this.requiredLevel && this.requiredLevel > 1
      ? `<p><i>Prerequisites: ${utils.ordinalSuffixOf(this.requiredLevel)}-level ${this.originClass}</i></p>`
      : "";
    const itemHeader = itemText
      ? `<p><i>Item: ${itemText}</i></p>`
      : "";

    const valueDamageText = DDBReferenceLinker.parseDamageRolls({ text: this.ddbInfusion.description, document: this.data, actor: undefined });
    const chatDamageText = chatAdd ? DDBReferenceLinker.parseDamageRolls({ text: this.snippet, document: this.data, actor: undefined }) : "";
    this.data.system.description = {
      value: DDBReferenceLinker.parseTags(prerequisitesHeader + itemHeader + valueDamageText),
      chat: chatAdd ? DDBReferenceLinker.parseTags(chatDamageText ?? "") : "",
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
    await this.compendiumFolders.createClassFeatureFolder(this.originClass, this.data.system.source.rules ?? "2014");
  }

  async addInfusionsToCompendium(documents: I5ePCItem[]) {
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
    const index = featureHandler.compendiumIndex;
    if (!index) {
      logger.warn(`No compendium index built for infusion features`, { featureHandler });
      return [];
    }
    const compendiumFeatures = index.filter((i) =>
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
        const activationName = DICTIONARY.actions.activationTypes.find((a) => a.id === activationType)?.value;
        const postfix = activationName && [3, 4].includes(activationType)
          ? ` (${utils.capitalize(activationName)})`
          : "";
        actionData.name = `${this.name}${postfix}`;
      }
      const action = DDBDataUtils.displayAsAttack(this.ddbData, actionData, this.rawCharacter)
        ? new DDBAttackAction({
          ddbData: this.ddbData,
          ddbDefinition: actionData,
          rawCharacter: this.rawCharacter,
          // the action type param is typed non-null but handles null at runtime
          type: actionData.actionSource as ICoreSourceTypes,
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
          // the action type param is typed non-null but handles null at runtime
          type: null as unknown as ICoreSourceTypes, // this might need to be class though
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
      const activityEffects = this.activity.data.effects;
      if (activityEffects && activityEffects.length > 0) {
        activityEffects[0].riders?.activity?.push(...ids);
      } else {
        this.actionsToAddToCompendium.push(actionItem);
      }
      for (const id of ids) {
        this.data.system.activities[id] = actionItem.system.activities[id];
        this.data.effects.push(...(actionItem.effects ?? []));
      }
    }

    if (this.actionsToAddToCompendium.length === 0) return;
    const cItems = await this.addInfusionsToCompendium(this.actionsToAddToCompendium);
    if (cItems.length === 0) return;

    const descriptions = this.ddbInfusion.actions.map((i) => `[[/item ${i.name}]]`);

    const uuids = cItems.map((i) => i.uuid);
    // for now just add riders to first effect
    const riderEffects = this.activity.data.effects;
    if (riderEffects && riderEffects.length > 0 && riderEffects[0].riders)
      riderEffects[0].riders.item = uuids;
    this.data.effects.forEach((e) => {
      // if (e.flags.ddbimporter?.infusion) e.flags.dnd5e.enchantment.riders.item.push(...uuids);
      e.system ??= {};
      e.system.changes ??= [];
      const change = ChangeHelper.addChange(`<hr><h2>Infusion Actions</h2><p> ${descriptions.join(", ")} </p>`, 20, "system.description.value");
      e.system.changes.push(change);
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

  _getEnchantmentEffect(modifierData: IDDBInfusionModifierData, { useModifierLabelName = false, useOrigin = false } = {}) {
    const label = modifierData.name ?? this.name;
    const foundryItem = foundry.utils.deepClone(this.data);
    foundryItem.effects = [];
    const effect = Effects.EnchantmentEffects.EnchantmentEffect(foundryItem, label, {
      origin: useOrigin ? `Item.${this.data._id}` : null,
    });
    foundry.utils.setProperty(effect, "flags.ddbimporter.infusion", true);
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
      character: this._character,
      // the mock only carries the fields the effect generator reads
      ddbItem: modifierItem as unknown as IDDBInventoryItem,
      document: foundryItem,
      isCompendiumItem: false, // isGeneric or isMuncher
      type: "infusion",
      description: this.snippet,
    });
    effect.system ??= {};
    const mockEffects = mockItem.effects ?? [];
    if (mockEffects.length > 0) effect.system.changes = mockEffects.map((e) => e.system?.changes ?? []).flat(1);

    effect.system.changes ??= [];
    effect.system.changes.push(...this._getMagicBonusChanges(modifiers));

    if (this.ddbInfusion.requiresAttunement) {
      const change = ChangeHelper.overrideChange("required", 20, "system.attunement");
      effect.system.changes.push(change);
    }

    const nameLabel = this.ddbInfusion.type === "replicate"
      ? `: Replicated [Infusion]`
      : `: ${useModifierLabelName ? label : this.name} [Infusion]`;
    const nameChange = ChangeHelper.addChange(nameLabel, 20, "name");
    effect.system.changes.push(nameChange);
    return effect;
  }

  _generateEnchantmentStubEffect() {
    const useModifierLabelName = ["damage-type-choice"].includes(this.ddbInfusion.modifierDataType ?? "");
    const effect = this._getEnchantmentEffect({}, {
      useModifierLabelName,
    });
    const effectLink: I5eActivityEffect = {
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
    this.activity.data.effects ??= [];
    this.activity.data.effects.push(effectLink);
    this.data.effects.push(effect);
  }

  _addDescriptionToEffect(effect: I5eEffectData) {
    const description = DDBTemplateStrings.parse(this.ddbData, this._character, this.ddbInfusion.description, this.ddbInfusion)?.text ?? "";
    effect.system ??= {};
    effect.system.changes ??= [];
    const change = ChangeHelper.addChange(`<hr> <h5>Infusion Details</h5>${description}`, 20, "system.description.value");
    effect.system.changes.push(change);
  }

  _generateEnchantmentEffects() {
    const useModifierLabelName = ["damage-type-choice"].includes(this.ddbInfusion.modifierDataType ?? "");
    for (const [index, effectData] of this.ddbInfusion.modifierData.entries()) {
      const effect = this._getEnchantmentEffect(effectData, {
        useModifierLabelName,
      });

      const effectLink: I5eActivityEffect = {
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

      const description = DDBTemplateStrings.parse(this.ddbData, this._character, this.ddbInfusion.snippet, this.ddbInfusion)?.text ?? "";

      switch (this.ddbInfusion.modifierDataType) {
        case "class-level": {
          const minLevel = effectData.value;
          const maxLevel = index < (this.ddbInfusion.modifierData.length - 1)
            ? (this.ddbInfusion.modifierData[index + 1].value ?? 0) - 1
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

      this.activity.data.effects ??= [];
      this.activity.data.effects.push(effectLink);
      this.data.effects.push(effect);
    }

  }

  _getMagicBonusChanges(modifiers: IDDBInfusionModifier[]) {
    // infusion modifiers share the shape filterModifiersOld/getModifierSum read
    const mods = modifiers as unknown as IModifiersMod[];
    const filteredModifiers = DDBModifiers.filterModifiersOld(mods, "bonus", "magic");
    const magicBonus = DDBModifiers.getModifierSum(filteredModifiers, this._character);

    const acFilteredModifiers = DDBModifiers.filterModifiersOld(mods, "bonus", "armor-class");
    const acMagicalBonus = DDBModifiers.getModifierSum(acFilteredModifiers, this._character);

    const changes = [];
    if (magicBonus && magicBonus !== "") {
      const change = ChangeHelper.addChange(magicBonus, 20, "system.magicalBonus");
      changes.push(change);
    }
    if (acMagicalBonus && acMagicalBonus !== "") {
      const change = ChangeHelper.overrideChange(acMagicalBonus, 20, "system.armor.magicalBonus");
      changes.push(change);
    }

    // all items infused become magical
    const change = ChangeHelper.addChange("mgc", 20, "system.properties");
    changes.push(change);
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
