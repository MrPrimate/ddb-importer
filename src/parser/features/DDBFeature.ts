import { DICTIONARY, SETTINGS } from "../../config/_module";
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
    this._class = this.ddbData.character.classes.find((klass) =>
      (this.ddbDefinition.classId
        && (klass.definition.id === this.ddbDefinition.classId || klass.subclassDefinition?.id === this.ddbDefinition.classId))
      || (this.ddbDefinition.className && klass.definition.name === this.ddbDefinition.className
        && ((!this.ddbDefinition.subclassName || this.ddbDefinition.subclassName === "")
          || (this.ddbDefinition.subclassName && klass.subclassDefinition?.name === this.ddbDefinition.subclassName))
      ),
    );
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
      isMuncher: this.ddbCharacter.isMuncher,
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
    if (
      (advancementData.value && Object.keys(advancementData.value).length !== 0)
      || advancementData.configuration.choices?.length !== 0
      || advancementData.configuration.grants?.length !== 0
      || advancementData.configuration.items?.length !== 0
    ) {
      this.data.system.advancement[advancementData._id] = advancementData;
    }
  }


  generateBackgroundAbilityScoreAdvancement() {
    const advancements: I5eAdvancement[] = [];

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

    const asiBuild = this.ddbData.character.feats.filter((f) => {
      return (this.ddbDefinition.grantedFeats ?? []).some((backgroundFeat) => {
        if (f.componentId !== backgroundFeat.id) return false;
        if (!backgroundFeat.featIds.includes(f.definition.id)) return false;
        if (f.definition.categories.some((c) => c.tagName === "__INITIAL_ASI")) return true;
        return false;
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

    if (asiBuild.length === 0) return;

    const modifiers = this.ddbData.character.modifiers.feat.filter((m) =>
      feats.some((f) => m.componentId == f.definition.id && m.componentTypeId == f.definition.entityTypeId),
    );

    // The choosable abilities are listed structurally on the background definition as
    // stat ids (e.g. Criminal primaryAbilities [2, 3, 4] = dex/con/int). The feat
    // description text varies too much to parse reliably.
    const available = (this.ddbDefinition.primaryAbilities ?? [])
      .map((statId) => DICTIONARY.actor.abilities.find((a) => a.id === statId)?.value)
      .filter((v) => v);

    // `locked` is the set of abilities the player may NOT pick, so lock everything not named.
    const locked = available.length > 0
      ? DICTIONARY.actor.abilities.map((a) => a.value).filter((v) => !available.includes(v))
      : [];

    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement);
    advancement.updateSource({
      configuration: {
        points: 3,
        cap: 2,
        max: 20,
        locked,
      },
      level: 0,
      value: {
        type: "asi",
      },
    });

    // Only populate assignments when DDB actually has assigned score modifiers;
    // otherwise emit an empty advancement for the player to assign in Foundry.
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
    advancements.push(advancement.toObject() as I5eAdvancement);

    for (const advancement of advancements) {
      if (!advancement._id) advancement._id = foundry.utils.randomID();
      this.data.system.advancement[advancement._id] = advancement;
    }
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

    this.data.system.advancement[advancement._id] = advancement.toObject() as I5eAdvancement;
  }


  generateFeatAbilityScoreAdvancement() {
    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement);
    const configuration = foundry.utils.duplicate(advancement.configuration);
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
        configuration.fixed[ability.value] = parseInt(fixedMatch[2]);
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
    let advancement = this.advancementHelper.getToolAdvancement({
      mods: mods,
      feature: this.ddbDefinition,
      level: 0,
    });
    // no tool modifiers selected: emit an empty advancement from an unselected tool choice
    if (!advancement) {
      advancement = this.advancementHelper.getEmptyToolAdvancement({
        feature: this.ddbDefinition,
        level: 0,
      });
    }
    this._addAdvancement(advancement);
  }

  // resolve the unique item definition names in the background equipment to compendium uuids
  // Resolve background equipment definitions to compendium uuids. Returns a map keyed by
  // `${definitionId}-${entityTypeId}`. DDB catalog names (e.g. "Clothes, Common") rarely match
  // the munched/SRD names ("Common Clothes"), so we match by id first and only fall back to name.
  async _resolveBackgroundEquipmentUuids(definitions) {
    const uuidMap = {};
    const keyOf = (def) => `${def.id}-${def.entityTypeId}`;

    // Pass A: id + entityTypeId against the munched DDB item compendium
    const ddbItems = CompendiumHelper.getCompendiumType("items", false);
    if (ddbItems) {
      const index = await ddbItems.getIndex({
        fields: ["name", "flags.ddbimporter.definitionId", "flags.ddbimporter.definitionEntityTypeId"],
      });
      for (const def of definitions) {
        const match = index.find((i) =>
          foundry.utils.getProperty(i, "flags.ddbimporter.definitionId") === def.id
          && foundry.utils.getProperty(i, "flags.ddbimporter.definitionEntityTypeId") === def.entityTypeId);
        if (match?.uuid) uuidMap[keyOf(def)] = match.uuid;
      }
    }

    // Pass B: version-aware SRD name fallback for anything still unresolved
    let outstanding = definitions.filter((def) => !uuidMap[keyOf(def)]);
    const packIds = this.is2024
      ? SETTINGS.FOUNDRY_COMPENDIUM_MAP["items2024"]
      : SETTINGS.FOUNDRY_COMPENDIUM_MAP["items"];
    for (const packId of packIds) {
      if (outstanding.length === 0) break;
      const entries = await CompendiumHelper.queryCompendiumEntries({
        compendiumName: packId,
        documentNames: outstanding.map((def) => def.name),
      });
      if (!entries) continue;
      outstanding = outstanding.filter((def, i) => {
        if (entries[i]?.uuid) {
          uuidMap[keyOf(def)] = entries[i].uuid;
          return false;
        }
        return true;
      });
    }

    for (const def of outstanding) {
      logger.warn(`Could not find compendium item for background equipment "${def.name}" (id ${def.id})`);
    }
    return uuidMap;
  }

  async _generateBackgroundEquipment() {
    const slots = this.ddbData.backgroundEquipment?.slots ?? [];
    if (slots.length === 0) return;

    const isItemRule = (rule) => (rule.definitions ?? []).length > 0;
    const ruleSlotHasItems = (ruleSlot) => (ruleSlot.rules ?? []).some((rule) => isItemRule(rule));

    // collect unique item definitions for a single batch of compendium lookups; only
    // single-definition rules are specific items, multi-definition rules are category
    // choices and need no item uuid
    const definitionMap = new Map();
    for (const slot of slots) {
      for (const ruleSlot of slot.ruleSlots ?? []) {
        for (const rule of ruleSlot.rules ?? []) {
          const definitions = rule.definitions ?? [];
          if (definitions.length === 1 && definitions[0].name) {
            const def = definitions[0];
            definitionMap.set(`${def.id}-${def.entityTypeId}`, def);
          }
        }
      }
    }
    const uuidMap = await this._resolveBackgroundEquipmentUuids([...definitionMap.values()]);

    const entries: I5eClassStartingEquipment[] = [];
    let totalGold = 0;
    let sort = 0;
    const nextSort = () => (sort += 100000);

    const buildLinked = (rule, group) => {
      const definition = (rule.definitions ?? [])[0];
      const uuid = definition ? uuidMap[`${definition.id}-${definition.entityTypeId}`] : undefined;
      if (!uuid) return;
      entries.push({
        type: "linked",
        count: rule.quantity > 1 ? rule.quantity : null,
        key: uuid,
        requiresProficiency: false,
        _id: foundry.utils.randomID(),
        group,
        sort: nextSort(),
      });
    };

    const buildCurrency = (rule, group) => {
      entries.push({
        type: "currency",
        count: rule.gold,
        key: "gp",
        requiresProficiency: false,
        _id: foundry.utils.randomID(),
        group,
        sort: nextSort(),
      });
    };

    // a rule with multiple definitions is a category choice (e.g. any gaming set, any
    // simple weapon); classify a definition to a dnd5e category option type + key
    const WEAPON_CATEGORY = { 1: "sim", 2: "mar", 3: "mar" };
    const FOCUS_SUBTYPES = { "Arcane Focus": "arcane", "Druidic Focus": "druidic", "Holy Symbol": "holy" };
    const ARMOR_KEYS = new Set(["light", "medium", "heavy", "shield", "natural"]);

    const classifyDefinition = (def) => {
      if (def.entityTypeId === 1782728300 || def.filterType === "Weapon") {
        return { type: "weapon", key: WEAPON_CATEGORY[def.categoryId] ?? "sim" };
      }
      if (def.armorTypeId != null) {
        const entry = DICTIONARY.equipment.armorType.find((a) => a.id === def.armorTypeId);
        if (entry?.value && ARMOR_KEYS.has(entry.value)) return { type: "armor", key: entry.value };
      }
      if (def.subType && FOCUS_SUBTYPES[def.subType]) {
        return { type: "focus", key: FOCUS_SUBTYPES[def.subType] };
      }
      const tool = AdvancementHelper.getDictionaryTool(def.name);
      if (tool?.toolType) return { type: "tool", key: tool.toolType };
      if (def.gearTypeId === 11) return { type: "tool", key: "game" };
      return null;
    };

    const buildCategoryChoice = (rule, group) => {
      const classified = (rule.definitions ?? []).map(classifyDefinition).filter(Boolean);
      const distinct = new Set(classified.map((c) => `${c.type}:${c.key}`));
      if (distinct.size !== 1) {
        logger.warn("Could not resolve background equipment category choice", {
          defs: (rule.definitions ?? []).map((d) => d.name),
        });
        return;
      }
      const { type, key } = classified[0];
      entries.push({
        type,
        count: rule.quantity > 1 ? rule.quantity : null,
        key,
        requiresProficiency: false,
        _id: foundry.utils.randomID(),
        group,
        sort: nextSort(),
      });
    };

    const buildEquipmentOption = (ruleSlot, group) => {
      const andId = foundry.utils.randomID();
      entries.push({
        type: "AND",
        requiresProficiency: false,
        _id: andId,
        group,
        sort: nextSort(),
      });
      for (const rule of ruleSlot.rules ?? []) {
        const defs = rule.definitions ?? [];
        if (defs.length > 1) buildCategoryChoice(rule, andId);
        else if (defs.length === 1) buildLinked(rule, andId);
        // gold bundled with the equipment option becomes a currency entry in the group
        else if (rule.gold) buildCurrency(rule, andId);
      }
    };

    for (const slot of slots) {
      const ruleSlots = slot.ruleSlots ?? [];
      const equipmentOptions = ruleSlots.filter((rs) => ruleSlotHasItems(rs));
      const moneyOnlyOptions = ruleSlots.filter((rs) => !ruleSlotHasItems(rs));

      // a money-only alternative (e.g. "or (B) 50 GP") => wealth; gold bundled with an
      // equipment option is added as a currency entry in buildEquipmentOption instead
      for (const ruleSlot of moneyOnlyOptions) {
        for (const rule of ruleSlot.rules ?? []) {
          totalGold += rule.gold ?? 0;
        }
      }

      if (equipmentOptions.length === 1) {
        buildEquipmentOption(equipmentOptions[0], "");
      } else if (equipmentOptions.length > 1) {
        const orId = foundry.utils.randomID();
        entries.push({
          type: "OR",
          requiresProficiency: false,
          _id: orId,
          group: "",
          sort: nextSort(),
        });
        for (const ruleSlot of equipmentOptions) {
          buildEquipmentOption(ruleSlot, orId);
        }
      }
    }

    if (entries.length > 0) this.data.system.startingEquipment = entries;
    if (totalGold > 0) this.data.system.wealth = String(totalGold);
  }

  async _generateSpellAdvancements() {
    switch (this.type) {
      case "trait":
      case "race": {
        const advancements = await AdvancementHelper.getTraitSpellAdvancements({
          name: this.ddbDefinition.name,
          species: this.ddbCharacter?._ddbRace.fullName,
          description: this.ddbDefinition.description,
          is2024: this.is2024,
        }, this.spellLinks);
        if (advancements) {
          advancements.forEach((advancement) => this._addAdvancement(advancement));
        }
      }
      // no default
    }
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
    await this._generateSpellAdvancements();
  }

  async buildBackgroundFeatAdvancements() {
    // Granted feats live on the background definition's `grantedFeats` ([{ id, name, featIds }]),
    // NOT on `featList` (which is an array, so `featList.featIds` was always undefined). The ASI
    // grant (categories include `__INITIAL_ASI`) is handled by
    // generateBackgroundAbilityScoreAdvancement, so we exclude it here.
    const grantedFeats = this.ddbDefinition.grantedFeats ?? [];
    if (grantedFeats.length === 0) return;

    const chosenFeats = this.ddbData.character.feats.filter((f) =>
      grantedFeats.some((bgFeat) =>
        f.componentId === bgFeat.id
        && bgFeat.featIds.includes(f.definition.id)
        && !f.definition.categories.some((c) => c.tagName === "__INITIAL_ASI")),
    );

    if (chosenFeats.length === 0) return;

<<<<<<< HEAD
    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemGrantAdvancement);
=======
>>>>>>> 73592e1f3 (Background equipment and feat fixes)
    const indexFilter = {
      fields: [
        "name",
        "flags.ddbimporter.id",
      ],
    };
    const compendium = CompendiumHelper.getCompendiumType("feats", false);
    if (compendium) await compendium.getIndex(indexFilter);

    const matchFeatId = (id) => compendium
      ? compendium.index.find((f) => foundry.utils.getProperty(f, "flags.ddbimporter.id") === id)
      : undefined;

    const advancementLinkData: IDDBFeaturesAdvancementLinkData[] = foundry.utils.getProperty(this.data, "flags.ddbimporter.advancementLink") as IDDBFeaturesAdvancementLinkData[] ?? [];

    for (const ddbFeat of chosenFeats) {
      const bgFeat = grantedFeats.find((g) => g.id === ddbFeat.componentId);
      const chosenMatch = matchFeatId(ddbFeat.definition.id);
      if (!chosenMatch) {
        // Still emit the advancement (empty) so the player can assign in Foundry; only the
        // automatic link is skipped. Usually means the feats have not been munched to the compendium.
        logger.warn(`Unable to link background feat ${ddbFeat.definition.name}, this is probably because the feats have not been munched to the compendium`, { ddbFeat });
      }

      const isChoice = (bgFeat?.featIds.length ?? 1) > 1;
      const advancement = isChoice
        ? new game.dnd5e.documents.advancement.ItemChoiceAdvancement()
        : new game.dnd5e.documents.advancement.ItemGrantAdvancement();

      if (isChoice) {
        const uuids = (bgFeat?.featIds ?? [])
          .map((id) => matchFeatId(id)?.uuid)
          .filter((uuid) => uuid);
        const update: I5eAdvancementItemChoice = {
          title: "Feat",
          configuration: {
            allowDrops: true,
            pool: uuids.map((uuid) => {
              return { uuid };
            }),
            choices: {
              "0": {
                count: 1,
                replacement: false,
              },
            },
            type: "feat",
            restriction: {
              type: "feat",
              subtype: this.is2024 ? "origin" : undefined,
            },
          },
        };
        advancement.updateSource(update as any);
      } else {
        const update: I5eAdvancementItemGrant = {
          configuration: {
            items: chosenMatch ? [{ uuid: chosenMatch.uuid }] : [],
          },
          title: "Feat",
        };
        advancement.updateSource(update as any);
      }

      this.data.system.advancement[advancement._id] = advancement.toObject() as I5eAdvancement;

      // Only record link data when matched. Key by the DDB feat name (`definition.name`), since
      // the post-import linker (getDataFeature) matches on `flags.ddbimporter.originalName ?? name`,
      // not the compendium name.
      if (chosenMatch) {
        advancementLinkData.push({
          _id: advancement._id,
          features: {
            [ddbFeat.definition.name]: chosenMatch.uuid,
          },
        });
      }
    }

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
      logger.error("Error", err);
    }
  }

  static CHOICE_DEFS = DICTIONARY.parsing.choiceFeatures;

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
    const chosenOnly = DDBFeature.CHOICE_DEFS.USE_CHOSEN_ONLY.includes(this.originalName);
    const choices = chosenOnly
      ? this._chosen
      : DDBFeature.CHOICE_DEFS.USE_ALL_CHOICES.includes(this.originalName)
        ? this._choices
        : this._parentOnlyChoices;

    const choiceText = choices
      .filter((c) =>
        !DDBChoiceFeature.NEVER_CHOICES.includes(c.label)
        && !DICTIONARY.actor.skills.map((s) => s.label).includes(c.label)
        && !DICTIONARY.actor.proficiencies.filter((p) => p.type === "Tool").map((p) => p.label).includes(utils.nameString(c.label)),
      )
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

    const secretText = DDBFeature.CHOICE_DEFS.NO_CHOICE_DESCRIPTION_ADDITION.includes(this.originalName)
      || ["feat"].includes(this.type) // don't add choice options for feats
      || joinedText.trim() === ""
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
      logger.error("Error", err);
    }
  }

}
