import { DICTIONARY, SETTINGS } from "../../config/_module";
import { utils, logger, CompendiumHelper } from "../../lib/_module";
import AdvancementHelper from "../advancements/AdvancementHelper";
import { DDBModifiers, DDBDataUtils, SystemHelpers } from "../lib/_module";
import DDBAttackAction from "./DDBAttackAction";
import DDBChoiceFeature from "./DDBChoiceFeature";
import DDBFeatureMixin from "./DDBFeatureMixin";


const WEAPON_CATEGORIES: Record<number, string> = { 1: "sim", 2: "mar", 3: "mar" };
const FOCUS_SUBTYPES: Record<string, string> = { "Arcane Focus": "arcane", "Druidic Focus": "druidic", "Holy Symbol": "holy" };
const ARMOR_KEYS = new Set(["light", "medium", "heavy", "shield", "natural"]);

// ability and damage type names, lower case (DDBFeature.isTraitLabel)
let traitLabels: Set<string> | null = null;

export default class DDBFeature extends DDBFeatureMixin {

  declare advancementHelper: AdvancementHelper;
  declare isChoiceFeature: boolean;
  declare include: boolean;
  declare hasRequiredLevel: boolean;
  declare _choices: IDDBChoiceResult[];
  declare _chosen: IDDBChoiceResult[];
  declare _parentOnlyChoices: IDDBChoiceResult[];
  declare _parentOnlyChosen: IDDBChoiceResult[];

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


  override _init() {
    this.documentType = DDBAttackAction.FORCE_WEAPON_FEATURES.includes(this.originalName)
      ? "weapon" as const
      : (DDBFeature.DOC_TYPE as Record<string, string>)[this.type] as typeof this.documentType;
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
    }, [] as IDDBChoiceResult[]);
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
    // Number() preserves the loose comparison semantics for a null/undefined requiredLevel
    this.hasRequiredLevel = !this._class || (this._class && this._class.level >= Number(this.ddbDefinition.requiredLevel));

    this.advancementHelper = new AdvancementHelper({
      ddbData: this.ddbData,
      type: this.type,
      isMuncher: this.ddbCharacter?.isMuncher ?? this.isMuncher,
    });
  }

  override _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: DDBDataUtils.getName(this.ddbData, this.ddbDefinition, this.rawCharacter),
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
          // DDB uses null for unset ids; the flag types declare these optional
          // only, keep the runtime null values unchanged
          componentId: this.ddbDefinition.componentId as number | undefined,
          componentTypeId: this.ddbDefinition.componentTypeId as number | undefined,
          originalName: this.originalName,
          dndbeyond: {
            requiredLevel: this.ddbDefinition.requiredLevel as number | undefined,
            displayOrder: this.ddbDefinition.displayOrder as number | undefined,
            featureType: this.ddbDefinition.featureType as number | undefined,
            class: this.ddbDefinition.className as string | undefined,
            classId: this.ddbDefinition.classId as number | undefined,
            entityId: this.ddbDefinition.entityId as number | undefined,
            entityRaceId: this.ddbDefinition.entityRaceId as number | undefined,
            entityType: this.ddbDefinition.entityType as string | undefined,
          },
        },
      },
    };
  }


  override _prepare() {
    // override this feature
    this._generateLevelScale();
    this._generateActionTypes();
    this._generateFlagHints();

    this.excludedScaleUses = DDBFeature.LEVEL_SCALE_EXCLUSION_USES.includes(this.ddbDefinition.name)
      || DDBFeature.LEVEL_SCALE_EXCLUSION_USES.includes(this.data.name)
      || DDBFeature.LEVEL_SCALE_EXCLUSION_USES_STARTS_WITH.some((f) => this.originalName.startsWith(f));

    this.scaleValueUsesLink = DDBDataUtils.getScaleValueLink(this.ddbData, this.ddbDefinition, true) ?? "";

    this.useUsesScaleValueLink = !this.excludedScaleUses
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

  _addAdvancement(advancement: dnd5e.types.Advancement.Instance | null) {
    if (!advancement) return;
    const advancementData = advancement.toObject() as unknown as I5eAdvancement;
    if (
      (advancementData.value && Object.keys(advancementData.value).length !== 0)
      || (foundry.utils.getProperty(advancementData, "configuration.choices") as any[])?.length !== 0
      || (foundry.utils.getProperty(advancementData, "configuration.grants") as any[])?.length !== 0
      || (foundry.utils.getProperty(advancementData, "configuration.items") as any[])?.length !== 0
    ) {
      if (!advancementData._id) advancementData._id = foundry.utils.randomID();
      this.data.system.advancement ??= {};
      this.data.system.advancement[advancementData._id] = advancementData;
    }
  }

  /**
   * The abilities a 2024 background's ASI pseudo-feat offers, read from its description:
   * "The X Background allows you to choose between Constitution, Intelligence, Wisdom. Increase
   * one of these scores by 2 ...". Returns [] unless exactly three abilities are named, so an
   * unexpected wording leaves the advancement unlocked rather than wrongly locked.
   */
  static backgroundAsiAbilitiesFromText(description: string): T5eAbility[] {
    const text = utils.stripHtml(description).replace(/\s+/g, " ");
    const match = text.match(/choose between (.+?)\. Increase/i);
    if (!match) return [];
    const named = match[1].toLowerCase();
    const abilities = DICTIONARY.actor.abilities
      .filter((a) => new RegExp(`\\b${a.long}\\b`).test(named))
      .map((a) => a.value);
    return abilities.length === 3 ? abilities : [];
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
    // stat ids (e.g. Criminal primaryAbilities [2, 3, 4] = dex/con/int). Many 2024
    // backgrounds outside the PHB (Arcana Unleashed, Eberron) leave that list empty, and
    // then the ASI pseudo-feat's "allows you to choose between ..." sentence names them.
    const structured = (this.ddbDefinition.primaryAbilities ?? [])
      .map((statId) => DICTIONARY.actor.abilities.find((a) => a.id === statId)?.value)
      .filter((v): v is T5eAbility => !!v);
    const available = structured.length > 0
      ? structured
      : DDBFeature.backgroundAsiAbilitiesFromText(asiBuild[0].definition.description ?? "");

    // `locked` is the set of abilities the player may NOT pick, so lock everything not named.
    const locked = available.length > 0
      ? DICTIONARY.actor.abilities.map((a) => a.value).filter((v) => !available.includes(v))
      : [];

    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement);

    const update: I5eAdvancementAbilityScoreImprovement = {
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
    };

    advancement.updateSource(update as any);

    // Only populate assignments when DDB actually has assigned score modifiers;
    // otherwise emit an empty advancement for the player to assign in Foundry.
    if (modifiers.length > 0) {
      const assignments = {};
      DICTIONARY.actor.abilities.forEach((ability) => {
        const count = DDBModifiers.filterModifiers(modifiers, "bonus", { subType: `${ability.long}-score` })
          // DDB sends a +2 either as two +1 modifiers or as one modifier of value 2
          .reduce((sum, mod) => sum + (Number(mod.value) || 1), 0);
        if (count > 0) (assignments as Record<string, any>)[ability.value] = count;
      });

      const update2: I5eAdvancementAbilityScoreImprovement = {
        value: {
          assignments,
        },
      };

      advancement.updateSource(update2 as any);
    }
    advancements.push(advancement.toObject() as I5eAdvancement);

    this.data.system.advancement ??= {};
    for (const advancement of advancements) {
      if (!advancement._id) advancement._id = foundry.utils.randomID();
      this.data.system.advancement[advancement._id] = advancement;
    }
  }


  _addFeatAbilityScoreAdvancement(update: I5eAdvancementAbilityScoreImprovement, advancement: dnd5e.types.Advancement.Instance) {
    advancement.updateSource(update as any);
    if (!this.isMuncher) {
      const modifiers = this.ddbData.character.modifiers.feat.filter((m) =>
        m.componentId == this.ddbDefinition.id
        && m.componentTypeId == this.ddbDefinition.entityTypeId,
      );

      if (modifiers.length > 0) {
        const assignments = {};
        DICTIONARY.actor.abilities.forEach((ability) => {
          const count = DDBModifiers.filterModifiers(modifiers, "bonus", { subType: `${ability.long}-score` })
            // DDB sends a +2 either as two +1 modifiers or as one modifier of value 2
            .reduce((sum, mod) => sum + (Number(mod.value) || 1), 0);
          if (count > 0) (assignments as Record<string, any>)[ability.value] = count;
        });

        const update = {
          value: {
            assignments,
          },
        };
        advancement.updateSource(update as any);
      }
    }

    this.data.system.advancement ??= {};
    // the Advancement _id schema initial is a randomID, so it is always set
    const advancementId = foundry.utils.getProperty(advancement, "_id") as string;
    this.data.system.advancement[advancementId] = advancement.toObject() as I5eAdvancement;
  }


  generateFeatAbilityScoreAdvancement() {
    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement);
    // the fvtt-types duplicate() mapped type mangles the configuration shape
    const configuration = foundry.utils.duplicate(advancement.configuration) as unknown as I5eAdvASIConfig;
    configuration.points = 0;
    configuration.cap = 1;
    advancement.level = 0;
    foundry.utils.setProperty(advancement, "value.type", "asi");

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
        configuration.fixed ??= {};
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
  async _resolveBackgroundEquipmentUuids(definitions: IDDBItemDefinition[]) {
    const uuidMap: Record<string, string> = {};
    const keyOf = (def: IDDBItemDefinition) => `${def.id}-${def.entityTypeId}`;

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

  /**
   * DDB category catalogs include extra kits and weapons from other books. Prefer a category
   * explicitly named by this rule slot, but only when every definition supports that item type.
   */
  static backgroundEquipmentCategory(rule: IDDBEquipmentRule, ruleSlotName: string): { type: string; key: string } | null {
    const definitions = rule.definitions ?? [];
    if (definitions.length === 0) return null;

    const classified = definitions.map((def) => {
      if (def.entityTypeId === 1782728300 || def.filterType === "Weapon") {
        return { type: "weapon", key: WEAPON_CATEGORIES[def.categoryId ?? -1] ?? "" };
      }
      if (def.armorTypeId != null) {
        const entry = DICTIONARY.equipment.armorType.find((a) => a.id === def.armorTypeId);
        if (entry?.value && ARMOR_KEYS.has(entry.value)) return { type: "armor", key: entry.value };
      }
      if (def.subType && FOCUS_SUBTYPES[def.subType]) return { type: "focus", key: FOCUS_SUBTYPES[def.subType] };
      const declaredToolGroup = AdvancementHelper.getToolGroup(def.subType ?? "");
      if (declaredToolGroup) return { type: "tool", key: declaredToolGroup };
      const tool = AdvancementHelper.getDictionaryTool(def.name);
      if (tool || def.gearTypeId === 11) return { type: "tool", key: tool?.toolType ?? "" };
      return null;
    });
    const allType = (type: string) => classified.every((entry) => entry?.type === type);
    // Instruction is specific to a rule; the enclosing slot can describe several bundled items.
    for (const label of [rule.instruction, ruleSlotName]) {
      const text = utils.nameString(label ?? "").toLowerCase();
      if (allType("tool")) {
        const categories = [
          { key: "art", matches: (/artisan'?s? tools/).test(text) },
          { key: "music", matches: (/musical? instrument/).test(text) },
          { key: "game", matches: (/gaming set/).test(text) },
        ].filter((category) => category.matches);
        // A mention must also have a matching catalog member, so another bundled item's
        // category cannot turn an instrument list into artisan's tools.
        if (categories.length === 1 && classified.some((entry) => entry?.key === categories[0].key)) {
          return { type: "tool", key: categories[0].key };
        }
      }
      if (allType("weapon")) {
        const simple = (/simple (?:melee |ranged )?weapons?/).test(text);
        const martial = (/martial (?:melee |ranged )?weapons?/).test(text);
        if (simple !== martial) return { type: "weapon", key: simple ? "sim" : "mar" };
        if ((/weapons?/).test(text)) return { type: "weapon", key: "" };
      }
    }
    const first = classified[0];
    if (!first || !first.key) return null;
    return classified.every((entry) => entry?.type === first.type && entry.key === first.key) ? first : null;
  }

  async _generateBackgroundEquipment() {
    const slots = this.ddbData.backgroundEquipment?.slots ?? [];
    if (slots.length === 0) return;

    const isItemRule = (rule: IDDBEquipmentRule) => (rule.definitions ?? []).length > 0;
    const ruleSlotHasItems = (ruleSlot: IDDBEquipmentRuleSlot) => (ruleSlot.rules ?? []).some((rule) => isItemRule(rule));

    // collect unique item definitions for a single batch of compendium lookups; only
    // single-definition rules are specific items, multi-definition rules are category
    // choices and need no item uuid
    const definitionMap = new Map<string, IDDBItemDefinition>();
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

    const buildLinked = (rule: IDDBEquipmentRule, group: string) => {
      const definition = (rule.definitions ?? [])[0];
      const uuid = definition ? uuidMap[`${definition.id}-${definition.entityTypeId}`] : undefined;
      if (!uuid) return;
      entries.push({
        type: "linked",
        count: (rule.quantity ?? 0) > 1 ? rule.quantity : null,
        key: uuid,
        requiresProficiency: rule.proficiencyRequired ?? false,
        _id: foundry.utils.randomID(),
        group,
        sort: nextSort(),
      });
    };

    const buildCurrency = (rule: IDDBEquipmentRule, group: string) => {
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

    const buildCategoryChoice = (rule: IDDBEquipmentRule, group: string, ruleSlot: IDDBEquipmentRuleSlot) => {
      const category = DDBFeature.backgroundEquipmentCategory(rule, ruleSlot.name);
      if (!category) {
        logger.warn(`Could not resolve background equipment category choice for ${this.ddbDefinition.name}: ${ruleSlot.name}`, {
          background: this.ddbDefinition.name,
          ruleSlot: ruleSlot.name,
          instruction: rule.instruction,
          defs: (rule.definitions ?? []).map((d) => d.name),
        });
        return;
      }
      entries.push({
        ...category,
        count: (rule.quantity ?? 0) > 1 ? rule.quantity : null,
        requiresProficiency: rule.proficiencyRequired ?? false,
        _id: foundry.utils.randomID(),
        group,
        sort: nextSort(),
      });
    };

    const buildEquipmentOption = (ruleSlot: IDDBEquipmentRuleSlot, group: string) => {
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
        if (defs.length > 1) buildCategoryChoice(rule, andId, ruleSlot);
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

    const backgroundSystem = this.data.system as I5eBackgroundSystemData;
    if (entries.length > 0) backgroundSystem.startingEquipment = entries;
    if (totalGold > 0) backgroundSystem.wealth = String(totalGold);
  }

  async _generateSpellAdvancements() {
    switch (this.type as string) {
      case "trait":
      case "race": {
        const advancements = await AdvancementHelper.getTraitSpellAdvancements({
          name: this.ddbDefinition.name,
          species: this.ddbCharacter?._ddbRace.fullName ?? "",
          description: this.ddbDefinition.description,
          is2024: this.is2024,
        }, this.spellLinks);
        if (advancements) {
          advancements.forEach((advancement) => this._addAdvancement(advancement as dnd5e.types.Advancement.Instance));
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

    // One advancement per granted entry. An entry offering several feats is a choice the player
    // may not have made yet (the background muncher's mule never picks one, and a new character
    // may not have): it still gets its ItemChoice, just without a chosen feat to link.
    const grants = grantedFeats.map((bgFeat) => ({
      bgFeat,
      ddbFeat: this.ddbData.character.feats.find((f) =>
        f.componentId === bgFeat.id && bgFeat.featIds.includes(f.definition.id)) ?? null,
    })).filter(({ bgFeat, ddbFeat }) => ddbFeat
      ? !ddbFeat.definition.categories.some((c) => c.tagName === "__INITIAL_ASI")
      // an unpicked entry has no categories to read; the ASI pseudo-feat is named for what it does
      : !(/Ability Score|Ability Improvement/i).test(bgFeat.name ?? ""));

    if (grants.length === 0) return;

    const indexFilter = {
      fields: [
        "name",
        "flags.ddbimporter.id",
      ],
    };
    const compendium = CompendiumHelper.getCompendiumType("feats", false);
    if (compendium) await compendium.getIndex(indexFilter);

    const matchFeatId = (id: number) => compendium
      ? compendium.index.find((f) => foundry.utils.getProperty(f, "flags.ddbimporter.id") === id)
      : undefined;

    const advancementLinkData: IDDBFeaturesAdvancementLinkData[] = foundry.utils.getProperty(this.data, "flags.ddbimporter.advancementLink") as IDDBFeaturesAdvancementLinkData[] ?? [];

    for (const { bgFeat, ddbFeat } of grants) {
      const isChoice = bgFeat.featIds.length > 1;
      // an unpicked single grant still names its one feat
      const featId = ddbFeat?.definition.id ?? (isChoice ? null : bgFeat.featIds[0]);
      const chosenMatch = featId ? matchFeatId(featId) : undefined;
      if (featId && !chosenMatch) {
        // Still emit the advancement (empty) so the player can assign in Foundry; only the
        // automatic link is skipped. Usually means the feats have not been munched to the compendium.
        logger.warn(`Unable to link background feat ${ddbFeat?.definition.name ?? bgFeat.name}, this is probably because the feats have not been munched to the compendium`, { ddbFeat, bgFeat });
      }

      const advancement = isChoice
        ? AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemChoiceAdvancement)
        : AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemGrantAdvancement);

      if (isChoice) {
        const uuids = bgFeat.featIds
          .map((id) => matchFeatId(id)?.uuid)
          .filter((uuid): uuid is string => Boolean(uuid));
        const update: I5eAdvancementItemChoice = {
          name: "Feat",
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
          name: "Feat",
        };
        advancement.updateSource(update as any);
      }

      this.data.system.advancement ??= {};
      // the Advancement _id schema initial is a randomID, so it is always set
      const advancementId = advancement._id as string;
      this.data.system.advancement[advancementId] = advancement.toObject() as I5eAdvancement;

      // Only record link data when matched. Key by the DDB feat name (`definition.name`), since
      // the post-import linker (getDataFeature) matches on `flags.ddbimporter.originalName ?? name`,
      // not the compendium name.
      if (chosenMatch && ddbFeat) {
        advancementLinkData.push({
          _id: advancementId,
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

      if (this.data.system.description) this.data.system.description.value += `</ul>`;
      this.data.img = "icons/skills/trades/academics-book-study-purple.webp";
      this.data.name = this.data.name.split("Background: ").pop() ?? this.data.name;

      await this.enricher.addDocumentAdvancements();
      await this.enricher.addDocumentOverride();
      this._final();
      await this.enricher.cleanup();
    } catch (err) {
      logger.warn(
        `Unable to Generate Background Feature: ${this.name}, please log a bug report. Err: ${utils.errorMessage(err)}`,
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
    const pool = this._parentOnlyChoices;
    return pool.length === 1
      && DDBFeature.CHOICE_DEFS.SINGLE_CHOICE_TOGGLE_PREFIXES
        .some((prefix) => (pool[0].label ?? "").startsWith(prefix));
  }

  /** A feature or option name reduced for containment checks: straight quotes, no quote marks. */
  static choiceNameKey(name: string): string {
    return utils.nameString(name).toLowerCase().replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
  }

  /**
   * A class feature whose whole pool is one option restating the feature: the bare name, or the
   * name after a feature prefix or a toggle verb ("Rage: Vitality of the Tree", "Wild Shape:
   * Object Shape", "Take Feline Form").
   * There is nothing to choose:
   * characters leave it unpicked and import the plain feature, but a class munch picks it, which
   * would add a choice of one beside the feature. The toggle check covers "Activate X".
   */
  get isRestatingSingleChoice(): boolean {
    if (this.type !== "class" || DDBFeature.CHOICE_DEFS.KEEP_CHOICE_FEATURE.includes(this.originalName)) return false;
    const pool = this._parentOnlyChoices;
    if (pool.length !== 1) return false;
    const name = DDBFeature.choiceNameKey(this.originalName);
    const label = DDBFeature.choiceNameKey(pool[0].label ?? "");
    if (name === "" || label === name) return name !== "";
    // the name must end the label: "Elemental Gift (Dao)" and "Full Bloom: Jade Vine" are real
    // options narrowed to one by an earlier pick
    if (!label.endsWith(name)) return false;
    // and only a feature prefix or a toggle verb may lead in: "Black Draconic Magic" is one of
    // ten real options served one per pass
    const leadIn = label.slice(0, -name.length).trim();
    return leadIn.endsWith(":") || DDBFeature.RESTATING_LEAD_INS.includes(leadIn);
  }

  /** Words leading into a restating option's label ("Enter Resolute Stance", "Take Feline Form"). */
  static RESTATING_LEAD_INS = ["activate", "active", "adopt", "enter", "ignite", "invoke the", "take"];

  /**
   * Does the feature cast this picked spell on its own uses, without a spell slot? DDB grants a
   * Mystic Arcanum pick under the feature with one use per long rest and no slot, and only the
   * choice document carries that cast; a Savant or Magical Discoveries pick lands in the
   * spellbook instead.
   */
  castsPickedSpell(choice: IDDBChoiceResult): boolean {
    const spells = this.ddbData?.character?.spells?.class ?? [];
    return spells.some((spell) => spell.componentId === this.ddbDefinition.id
      && !spell.usesSpellSlot
      && (spell.limitedUse?.maxUses ?? 0) > 0
      && (spell.definition?.id === choice.optionId || spell.definition?.name === choice.label));
  }

  /**
   * Is this choice a pick that never needs a document of its own? Proficiency picks (DDB choice
   * type 2: languages, skills, tools, saves, damage types) land through trait advancements and
   * built empty documents; spell picks (type 4) land in the spellbook unless the feature casts
   * the pick itself. Class features only: species and backgrounds match their own documents.
   */
  isPickOnlyChoice(choice: IDDBChoiceResult): boolean {
    if (!this.isPickChoice(choice)) return false;
    if (choice.choiceType === DDBFeature.PROFICIENCY_CHOICE_TYPE) return true;
    return !this._parentOnlyChosen.some((chosen) => this.castsPickedSpell(chosen));
  }

  /**
   * DDB choice types whose options are never feature text: ability scores (1), proficiencies,
   * languages, saves and resistances (2), spells (4), feats (6) and subclasses (7). Their
   * options land through advancements or documents of their own.
   */
  static NON_FEATURE_CHOICE_TYPES = [1, 2, 4, 6, 7];

  /**
   * Can this option's text belong in the parent's description? Only a feature option (DDB type 3,
   * or an option matched from the character's options, which carries no type) has a body worth
   * appending, and only when the parent does not already contain it (isChoiceDescriptionRedundant).
   */
  static isFeatureOptionChoice(choice: IDDBChoiceResult): boolean {
    if (choice.choiceType !== undefined && DDBFeature.NON_FEATURE_CHOICE_TYPES.includes(choice.choiceType)) return false;
    return !DDBFeature.isTraitLabel(choice.label ?? "");
  }

  /**
   * Does an option label name an ability or damage type rather than a feature? DDB also offers
   * these as feature options: a spellcasting ability ("Drow Lineage - Charisma", "Hemocraft
   * Modifier: Wisdom"), a resistance or breath type ("Cold Damage", "Acid"). Senses are left
   * out: The Third Eye's "Darkvision" is a feature benefit with its own text. The lead-in before
   * the last " - " or ": " and a trailing "Damage" are ignored.
   */
  static isTraitLabel(label: string): boolean {
    traitLabels ??= new Set([
      ...DICTIONARY.actor.abilities.map((ability) => ability.long),
      ...DICTIONARY.actor.damageAdjustments.map((adjustment) => adjustment.name.toLowerCase()),
    ]);
    const tail = utils.nameString(label).toLowerCase().split(/\s+-\s+|:\s+/).pop()?.trim() ?? "";
    return traitLabels.has(tail.replace(/\s+damage$/, ""));
  }

  /** A proficiency or spell pick (DDB choice type 2 or 4) on a class feature. */
  isPickChoice(choice: IDDBChoiceResult): boolean {
    return this.type === "class"
      && (choice.choiceType === DDBFeature.PROFICIENCY_CHOICE_TYPE || choice.choiceType === DDBFeature.SPELL_CHOICE_TYPE);
  }

  static PROFICIENCY_CHOICE_TYPE = 2;

  static SPELL_CHOICE_TYPE = 4;

  /** Every choice the class feature offers is a pick that needs no document (isPickOnlyChoice). */
  get isPickOnlyChoiceFeature(): boolean {
    if (DDBFeature.CHOICE_DEFS.KEEP_CHOICE_FEATURE.includes(this.originalName)) return false;
    const pool = this._parentOnlyChoices;
    return pool.length > 0 && pool.every((choice) => this.isPickOnlyChoice(choice));
  }

  override get suppressesChoiceBuild(): boolean {
    return super.suppressesChoiceBuild
      || this.isSingleToggleChoice
      || this.isRestatingSingleChoice
      || this.isPickOnlyChoiceFeature;
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
    if (lesserChoice.length >= DDBFeature.MIN_CHOICE_CONTAINMENT_LENGTH
      && lesserParent.includes(lesserChoice)) return true;
    // DDB's option copy can drift from the parent between sentences (a reworded lead-in, a
    // different break); when every substantial sentence appears in the parent it still repeats it
    // a colon ends a clause too: "centered on that point: Darkness." lists one option of several
    const sentences = lesserChoice.split(/(?<=[.!?:])\s+/)
      .map((sentence) => sentence.replace(DDBFeature.TRAILING_SENTENCE_PUNCTUATION, ""))
      .filter((sentence) => sentence.length >= DDBFeature.MIN_CHOICE_SENTENCE_LENGTH);
    return lesserChoice.length >= DDBFeature.MIN_CHOICE_CONTAINMENT_LENGTH
      && sentences.length > 0
      && sentences.every((sentence) => lesserParent.includes(sentence));
  }

  static MIN_CHOICE_SENTENCE_LENGTH = 20;

  async _buildChoiceFeature() {
    this._generateSystemType();
    this._generateSystemSubType();
    // a built option merges its uses into the parent; a pick or restating option is no longer
    // built, so that parent parses its own (Draconic Disciple's once per long rest). Listed and
    // enricher-owned parents keep their configured shape
    if (this.isPickOnlyChoiceFeature || this.isRestatingSingleChoice) this._generateLimitedUse();

    await this._generateSummons();
    await this._generateCompanions();
    await this._generateActivity({ hintsOnly: true });
    await this.enricher.addAdditionalActivities(this);

    // this._generateLimitedUse();
    // this._generateRange();

    const listItems: string[] = [];
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
        && !DICTIONARY.actor.proficiencies.filter((p) => p.type === "Tool").map((p) => p.name).includes(utils.nameString(c.label))
        && DDBFeature.isFeatureOptionChoice(c),
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
      }, [] as IDDBChoiceResult[])
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
          // a bare label (a language, a skill) adds nothing to a feature's body; only a
          // feature swapping its description for the chosen options lists them
          if (replaceDescription) listItems.push(`<li><p>${c.label}</p></li>`);
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

    await this.enricher.addDocumentAdvancements();
    await this.enricher.addDocumentOverride();
    this._final();
    // with no choice documents to follow, this parent is the finished feature
    if (this.suppressesChoiceBuild) await this.enricher.cleanup();
  }

  override async build(_choice?: unknown) {
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
        `Unable to Generate Basic Feature: ${this.name}, please log a bug report. Err: ${utils.errorMessage(err)}`,
        "extension",
      );
      logger.error(`Unable to Generate Basic Feature: ${this.name}`, err);
    }
  }

}
