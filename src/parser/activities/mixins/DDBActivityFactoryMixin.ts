import { DICTIONARY } from "../../../config/_module";
import { logger, utils } from "../../../lib/_module";
import DDBDescriptions from "../../lib/DDBDescriptions";
import DDBEnricherFactoryMixin from "../../enrichers/mixins/DDBEnricherFactoryMixin";
import SystemHelpers from "../../../lib/SystemHelpers";

const ACTIVITY_TYPES =  DICTIONARY.parsing.activity.types;

interface IDDBActivityFactoryMixin<TDoc extends string = TAFMDocTypes> {
  enricher?: any;
  activityGenerator?: any;
  documentType?: TDoc | null;
  notifier?: NotifierV1 | null;
  useMidiAutomations?: boolean;
  usesOnActivity?: boolean;
}

export default abstract class DDBActivityFactoryMixin<TDoc extends string = TAFMDocTypes> {

  abstract name: string | null;
  abstract isAction: boolean | null;
  abstract legacy: boolean;
  abstract is2014: boolean;
  abstract is2024: boolean;
  abstract originalName: string;
  abstract rawCharacter: I5ePCData | I5eMonsterData | null;
  enricher: DDBEnricherFactoryMixin<any>;
  activityGenerator: new (...args: any[]) => TDDBActivityTypes;
  additionalActivities: IAdditionalActivityOutline[] = [];
  // a document can pass through more than one build path; the extras are emitted once
  _multiSaveGenerated = false;
  // Activity description values inherited wholesale from the parent document rather than
  // written for one activity. Keyed by VALUE so clones and enricher id rewrites are covered,
  // and so an enricher-authored replacement de-stages itself. See _finaliseActivityDescriptions().
  _inheritedActivityDescriptions = new Set<string>();
  documentType: TDoc | null = null;
  useMidiAutomations = false;
  usesOnActivity = false;
  ignoreActivityGeneration = false;
  forceDefaultActionBuild = false;
  // assigned by subclass constructors (data stub generation) before any read
  data!: I5ePCItem | I5eFeatureItem | I5eMonsterItem | I5eVehicleItem;
  notifier: NotifierV1 | null;

  // These properties are used throughout the class but defined in subclasses,
  // whose constructors assign them before any read here.
  // Subclasses use narrower unions (IActionTypes, TDDBMonsterActionType, "spell", ...)
  type!: string;
  activityType!: IDDBActivityType;
  activityTypes: string[] = [];
  ddbDefinition!: IDDBCommonDefinition;
  ddbData!: IDDBData;
  activities: TDDBActivityTypes[] = [];

  constructor({
    enricher = null, activityGenerator, documentType = null, notifier = null, useMidiAutomations = false,
    usesOnActivity = false,
  }: IDDBActivityFactoryMixin = {}) {
    this.enricher = enricher;
    this.activityGenerator = activityGenerator;
    this.documentType = documentType as TDoc;
    this.notifier = notifier;
    this.useMidiAutomations = useMidiAutomations;
    this.usesOnActivity = usesOnActivity;
  }

  async loadEnricher(): Promise<void> {
    await this.enricher.init();
    await this.enricher.load({
      ddbParser: this as unknown as TDDBParsers,
    });
  }

  cleanup(): void {
    if (this.usesOnActivity) {
      foundry.utils.setProperty(this.data, "system.uses", {
        spent: null,
        max: null,
        recovery: [],
      });
    }
  }

  _getSaveActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.SAVE,
      ddbParent: this,
      nameIdPrefix: "save",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateSave: true,
      generateDamage: !["weapon"].includes(this.documentType!),
      generateRange: !["spell", "weapon"].includes(this.documentType!),
    }, options));

    return activity;
  }

  _getAttackActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.ATTACK,
      ddbParent: this,
      nameIdPrefix: "attack",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    const mergedOptions: TDDBActivityBuildOptions = foundry.utils.mergeObject({
      generateAttack: true,
      generateDamage: !["weapon"].includes(this.documentType!),
      generateRange: !["spell", "weapon"].includes(this.documentType!),
    }, options);

    activity.build(mergedOptions);
    return activity;
  }

  _getUtilityActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.UTILITY,
      ddbParent: this,
      nameIdPrefix: "utility",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateDamage: false,
      generateRange: !["spell", "weapon"].includes(this.documentType!),
    }, options));

    return activity;
  }

  _getTeleportActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.TELEPORT,
      ddbParent: this,
      nameIdPrefix: "teleport",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateDamage: false,
      generateRange: !["spell", "weapon"].includes(this.documentType!),
    }, options));

    return activity;
  }

  _getRollActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.UTILITY,
      ddbParent: this,
      nameIdPrefix: "roll",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateRoll: true,
      generateDamage: false,
      generateRange: !["spell", "weapon"].includes(this.documentType!),
    }, options));

    return activity;
  }

  _getForwardActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.FORWARD,
      ddbParent: this,
      nameIdPrefix: "forward",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject(options));

    return activity;
  }

  _getHealActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.HEAL,
      ddbParent: this,
      nameIdPrefix: "heal",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateActivation: true,
      generateDamage: false,
      generateHealing: true,
      generateRange: !["spell"].includes(this.documentType!),
    }, options));

    return activity;
  }

  _getDamageActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.DAMAGE,
      ddbParent: this,
      nameIdPrefix: "damage",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateDamage: !["weapon"].includes(this.documentType!),
      generateRange: !["spell", "weapon"].includes(this.documentType!),
    }, options));
    return activity;
  }

  _getEnchantActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.ENCHANT,
      ddbParent: this,
      nameIdPrefix: "enchant",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: !["spell"].includes(this.documentType!),
      generateDamage: false,
    }, options));
    return activity;
  }

  _getSummonActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.SUMMON,
      ddbParent: this,
      nameIdPrefix: "summon",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: !["spell"].includes(this.documentType!),
      generateDamage: false,
    }, options));
    return activity;
  }

  _getCheckActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.CHECK,
      ddbParent: this,
      nameIdPrefix: "check",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateCheck: true,
      generateActivation: true,
    }, options));
    return activity;
  }

  _getDDBMacroActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.DDBMACRO,
      ddbParent: this,
      nameIdPrefix: "mac",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    activity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateCheck: false,
      generateActivation: true,
      generateTarget: true,
      generateDDBMacro: true,
      targetOverride: {
        override: true,
        template: {
          contiguous: false,
          type: "",
          size: "",
          units: "ft",
        },
        affects: {},
      },
    }, options));
    return activity;
  }

  _getCastActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.CAST,
      ddbParent: this,
      nameIdPrefix: "cast",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    const buildOptions = foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateSpell: true,
      generateActivation: true,
    }, options);

    activity.build(buildOptions);
    return activity;
  }

  _getActivitiesType(): any {
    logger.error(`This method should be over ridden`, {
      this: this,
    });
    return null;
  }

  _getTransformActivity({ name = null, nameIdPostfix = null }: { name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const activity = new this.activityGenerator({
      name,
      type: ACTIVITY_TYPES.TRANSFORM,
      ddbParent: this,
      nameIdPrefix: "tran",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    const buildOptions = foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
      generateSpell: false,
      generateActivation: true,
    }, options);

    activity.build(buildOptions);
    return activity;
  }

  getActivity({ typeOverride = null, typeFallback = null, name = null, nameIdPostfix = null }: { typeOverride?: string | null; typeFallback?: string | null; name?: string | null; nameIdPostfix?: any } = {}, options: TDDBActivityBuildOptions = {}): any {
    const type = typeOverride ?? this._getActivitiesType();
    this.activityTypes.push(type);
    const data = { name, nameIdPostfix };
    switch (type) {
      case "save":
        return this._getSaveActivity(data, options);
      case "attack":
        return this._getAttackActivity(data, options);
      case "damage":
        return this._getDamageActivity(data, options);
      case "heal":
        return this._getHealActivity(data, options);
      case "utility":
        return this._getUtilityActivity(data, options);
      case "enchant":
        return this._getEnchantActivity(data, options);
      case "summon":
        return this._getSummonActivity(data, options);
      case "check":
        return this._getCheckActivity(data, options);
      case "ddbmacro":
        return this._getDDBMacroActivity(data, options);
      case "forward":
        return this._getForwardActivity(data, options);
      case "cast":
        return this._getCastActivity(data, options);
      case "transform":
        return this._getTransformActivity(data, options);
      case "roll":
        return this._getRollActivity(data, options);
      case "teleport":
        return this._getTeleportActivity(data, options);
      default:
        if (typeFallback) return this.getActivity({ typeOverride: typeFallback, name, nameIdPostfix }, options);
        return undefined;
    }
  }

  async _generateActivity({
    hintsOnly = false, name = null, nameIdPostfix = null, typeOverride = null, typeFallback = null,
  }: {
    hintsOnly?: boolean;
    name?: string | null;
    nameIdPostfix?: any;
    typeOverride?: string | null;
    typeFallback?: string | null;
  } = {}, optionsOverride: TDDBActivityBuildOptions = {},
  ): Promise<string | undefined> {
    if (this.ignoreActivityGeneration) return undefined;
    if (hintsOnly && !this.enricher.activity) return undefined;
    if (this.enricher.type === "none" || this.enricher.activity?.type === "none") return undefined;

    const activityOptions: TDDBActivityBuildOptions = (foundry.utils.getProperty(this.enricher, "activity.options") ?? {}) as TDDBActivityBuildOptions;
    const options: TDDBActivityBuildOptions = foundry.utils.mergeObject(
      foundry.utils.deepClone(optionsOverride),
      foundry.utils.deepClone(activityOptions),
    ) as TDDBActivityBuildOptions;

    if (this.usesOnActivity || this.enricher.usesOnActivity) {
      const uses = foundry.utils.getProperty(this.data, "system.uses") as I5eSystemLimitedUses | I5eConsumableUses | undefined;
      if (uses) {
        options.usesOverride = foundry.utils.deepClone(uses);
        options.usesOverride.override = true;
        options.generateUses = true;
      } else {
        logger.warn(`No system.uses found on ${this.data.name} when generating activity uses override`);
      }
    }

    const activity = this.getActivity({
      typeOverride: typeOverride ?? this.enricher.type ?? this.enricher.activity?.type,
      name,
      nameIdPostfix,
      typeFallback,
    }, options);


    if (!activity) {
      logger.debug(`No Activity type found for ${this.data.name}`, {
        this: this,
      });
      return undefined;
    }

    if (!this.activityType) this.activityType = activity.data.type;

    await this.enricher.applyActivityOverride(activity.data);
    this.activities.push(activity);

    if (this.enricher.activity?.addSingleFreeUse) {
      const singleActivity = foundry.utils.deepClone(activity.data);
      singleActivity.name = `${singleActivity.name} (Free use)`;
      singleActivity._id = `${singleActivity._id.slice(0, -3)}fre`;
      foundry.utils.setProperty(singleActivity, "consumption.targets", [
        {
          type: "activityUses",
          target: "",
          value: "1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ]);
      const period = this.enricher.activity.addSingleFreeRecoveryPeriod ?? "lr";
      foundry.utils.setProperty(singleActivity, "uses", {
        override: true,
        max: "1",
        spent: 0,
        recovery: [{ period, type: "recoverAll", formula: undefined }],
      });
      foundry.utils.setProperty(this.data, `system.activities.${singleActivity._id}`, singleActivity);
    }

    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;
  }

  // subclasses such as DDBSpell may return undefined when generation is skipped
  async _generateAdditionalActivities(): Promise<string[] | undefined> {
    if (!this.enricher.addAutoAdditionalActivities) return [];
    if (this.additionalActivities.length === 0) return [];
    let i = 0;
    const ids: string[] = [];
    for (const activityData of this.additionalActivities) {
      const id = await this._generateActivity({
        hintsOnly: false,
        name: activityData.name,
        nameIdPostfix: i,
        typeOverride: activityData.type,
      }, activityData.options);
      logger.debug(`Generated additional Activity with id ${id}`, {
        this: this,
        activityData,
        id,
      });
      if (id) ids.push(id);
      i++;
    }
    return ids;
  }


  /**
   * Give every region behavior a name, which becomes the name of the RegionBehavior
   * the activity places. Enrichers can pass one to the BehaviorHelper builders and
   * the native behaviors derive theirs at build time; a `ddbMacro` behavior can only
   * be named once every sibling activity its `activity` id might point at exists
   */
  _activityBehaviorNaming(): void {
    const activities = foundry.utils.getProperty(this.data, "system.activities") as Record<string, I5eActivity> | undefined;
    if (!activities) return;
    for (const activity of Object.values(activities)) {
      const behaviors = activity.behaviors;
      if (!Array.isArray(behaviors)) continue;
      for (const behavior of behaviors) {
        if (behavior.name || behavior.type !== "ddbMacro") continue;
        const config = (behavior.config ?? {}) as {
          activity?: string;
          args?: { activityName?: string };
        };
        const target = config.activity ? activities[config.activity] : undefined;
        // no activity id or name means the behavior uses the activity it hangs off
        behavior.name = target?.name || config.args?.activityName || activity.name || "";
      }
    }
  }

  /**
   * dnd5e falls back to the item's chat/full description when an activity description is
   * empty, and an activity description replaces that fallback rather than adding to it.
   * An inherited snippet is worth keeping only when it says
   * something shorter than the card would otherwise show: text that simply repeats the
   * document description, or that runs through several labelled sections describing the
   * whole feature, is dropped
   */
  _finaliseActivityDescriptions(): void {
    const inherited = this._inheritedActivityDescriptions;
    if (inherited.size === 0) return;

    const activities = foundry.utils.getProperty(this.data, "system.activities") as Record<string, I5eActivity> | undefined;
    const description = foundry.utils.getProperty(this.data, "system.description") as { chat?: string | null; value?: string | null } | undefined;
    const chat = description?.chat?.trim() ?? "";
    const value = description?.value?.trim() ?? "";

    for (const activity of Object.values(activities ?? {})) {
      const current = activity.description?.value;
      if (!current || !inherited.has(current)) continue;
      const repeatsDocument = (chat !== "" && utils.stringKindaEqual(current, chat))
        || (value !== "" && utils.stringKindaEqual(current, value));
      const wholeFeature = DDBDescriptions.sectionLabelCount(current) >= 2;
      if (!repeatsDocument && !wholeFeature) continue;
      // "" and not "<p></p>": blank markup is truthy and would suppress the native fallback
      activity.description!.value = "";
      logger.debug(`Cleared an inherited activity description on ${this.name}`, {
        activity: activity.name,
        repeatsDocument,
        wholeFeature,
      });
    }

    inherited.clear();
  }

  _activityEffectLinking(): void {
    const documentEffects = this.data.effects;
    if (!documentEffects || documentEffects.length === 0) return;
    if (!foundry.utils.hasProperty(this.data, "system.activities")) return;
    for (const activityId of Object.keys(this.data.system.activities)) {
      const activity = this.data.system.activities[activityId];
      if (!activity.effects || activity.effects.length !== 0) continue;
      if (foundry.utils.getProperty(activity, "flags.ddbimporter.noeffect")) continue;
      for (const effect of documentEffects) {
        const ignoreTransfer = foundry.utils.getProperty(effect, "flags.ddbimporter.ignoreTransfer") ?? false;
        if (effect.transfer && !ignoreTransfer) continue;
        if (foundry.utils.getProperty(effect, "flags.ddbimporter.noeffect")) continue;
        const activityNamesRequired = foundry.utils.hasProperty(effect, "flags.ddbimporter.activitiesMatch")
          ? foundry.utils.getProperty(effect, "flags.ddbimporter.activitiesMatch") as string[]
          : foundry.utils.hasProperty(effect, "flags.ddbimporter.activityMatch")
            ? [foundry.utils.getProperty(effect, "flags.ddbimporter.activityMatch")] as string[]
            : [] as string[];
        if (activityNamesRequired.length > 0 && !activityNamesRequired.includes(activity.name ?? "")) continue;
        if (!effect._id) effect._id = foundry.utils.randomID();
        const onSave = foundry.utils.getProperty(effect, "flags.ddbimporter.effectOnSave") === true;
        activity.effects.push({
          _id: effect._id,
          ...(onSave ? { onSave } : {}),
          level: foundry.utils.getProperty(effect, "flags.ddbimporter.effectIdLevel") ?? { min: null, max: null },
          riders: {
            activity: foundry.utils.getProperty(effect, "flags.ddbimporter.activityRiders") as string[] ?? [],
            effect: foundry.utils.getProperty(effect, "flags.ddbimporter.effectRiders") as string[] ?? [],
            item: foundry.utils.getProperty(effect, "flags.ddbimporter.itemRiders") as string[] ?? [],
          },
        });
      }
      this.data.system.activities[activityId] = activity;
    }

    // Track changes to rider activities & effects and store in item flags
    const riders = { activity: new Set<string>(), effect: new Set<string>() };
    for (const activityId of Object.keys(this.data.system.activities)) {
      const activity = this.data.system.activities[activityId];
      if (activity.type !== "enchant") continue;
      for (const e of activity.effects ?? []) {
        e.riders?.activity?.forEach((activity: string) => {
          riders.activity.add(activity);
        });
        e.riders?.effect?.forEach((effect: string) => {
          riders.effect.add(effect);
        });
      }
    }

    foundry.utils.setProperty(this.data, "flags.dnd5e.riders", {
      activity: Array.from(riders.activity),
      effect: Array.from(riders.effect),
    });

  }


  static getDamageParts(modifiers: any[], typeOverride: string | null = null): any[] {
    return modifiers
      .filter((mod: any) => Number.isInteger(mod.value)
        || (mod.dice ? mod.dice : mod.die ? mod.die : undefined) !== undefined,
      )
      .map((mod: any) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        if (die) {
          const damage = SystemHelpers.buildDamagePart({
            damageString: die.diceString,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else if (mod.value) {
          const damage = SystemHelpers.buildDamagePart({
            damageString: mod.value,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else if (mod.fixedValue) {
          const damage = SystemHelpers.buildDamagePart({
            damageString: mod.fixedValue,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else {
          return null;
        }
      }).filter((part: any) => part !== null);
  }

  static filterCombinedDamageParts(damageParts: any[]): any[] {
    const tracker: Record<string, any> = {};

    for (const part of damageParts) {
      const partKey = `${part.number ?? ""}${part.denomination ?? ""}${part.bonus ?? ""}${part.custom}${part.formula}`;
      if (tracker[partKey]) {
        tracker[partKey].types.push(...part.types);
      } else {
        tracker[partKey] = part;
      }
    }

    return Object.values(tracker);
  }

  static getCombinedDamageModifiers(modifiers: any[]): any[] {
    const damageModifiers = modifiers.filter((m: any) => m.type === "damage");

    const additionalDamageParts = DDBActivityFactoryMixin.getDamageParts(
      damageModifiers
        .filter((mod: any) => mod.type === "damage" && (!mod.restriction || mod.restriction === "")),
    );

    return DDBActivityFactoryMixin.filterCombinedDamageParts(additionalDamageParts);

  }

  // A document with more modes than this is a table or a set of unrelated properties
  // or, you kow, third party nonsense
  static MULTI_SAVE_MAX_EXTRAS = 5;

  /**
   * The labelled sections of a description that each name a saving throw.
   *
   * DDB writes a multi-mode item's properties as bold-labelled subsections - "Acid Jet.",
   * "Frost Shot.", "Empty Light of Death." - and it is those labels, not the saves themselves,
   * that tell one property from another. Returns an empty list unless at least two sections
   * carry a save, so a single-save document is never reshaped.
   *
   * `<table>` blocks are stripped first: a random-table item states a different save on every
   * row and none of them is a property of the item.
   */
  _saveBearingSections(text: string): { slice: ISectionSlice; save: IParsedSave }[] {
    if (!text?.trim()) return [];
    const sections = DDBDescriptions.sections(DDBDescriptions.stripTables(text));
    const bearing: { slice: ISectionSlice; save: IParsedSave }[] = [];
    for (const slice of sections) {
      // only the first save in a section counts: a repeat is the "repeat the save at the end of
      // each of its turns" restatement of the one the section already described
      const [save] = DDBDescriptions.parseSaves(slice.section);
      if (save) bearing.push({ slice, save });
    }
    return bearing.length >= 2 ? bearing : [];
  }

  // Beyond this a "label" is a prerequisite clause or a sentence, not a name for an activity.
  static MULTI_SAVE_NAME_MAX_LENGTH = 40;

  /**
   * Trim a DDB section label down to an activity name, or return "" when it does not read as a
   * name at all.
   *
   * DDB terminates labels with a period or colon and often appends a charge cost
   * ("Splashing Mucous (1 Charge)"). Some sections are labelled with a wholly parenthesised
   * qualifier instead - Silverwind's "(Prerequisite: 8th level, Fey Ancestry trait...)" - and
   * those fall back to the ability-and-save name.
   */
  static multiSaveActivityName(rawLabel: string): string {
    const name = rawLabel
      .replace(/\s*\((?:\d+\s*charges?|\d+\s*uses?)\)\s*$/i, "")
      .replace(/[.:;]+$/, "")
      .trim();
    if (name.startsWith("(")) return "";
    if (name.length > DDBActivityFactoryMixin.MULTI_SAVE_NAME_MAX_LENGTH) return "";
    return name;
  }

  /** "Dex Save", or "Str/Dex Save" for an either/or, used when no section label names the mode. */
  static multiSaveFallbackName(save: IParsedSave): string {
    const abilities = save.ability
      .map((ability) => `${ability.charAt(0).toUpperCase()}${ability.slice(1)}`)
      .join("/");
    return `${abilities} Save`;
  }

  /**
   * Emit one save activity per property beyond the first for a document whose rules text
   * describes several saving throws.
   *
   * Only the first save survives the single-save parsers (`DDBItem.parseSaveFromDescription`,
   * `DDBDescriptions.dcParser`), so everything else an item does exists only as prose. Where the
   * text is sectioned each section becomes an activity named after its own label and carrying its
   * own damage and area; where it is flat the saves are deduplicated by roll and DC and named
   * "<Abl> Save".
   *
   * Nothing is emitted when an enricher already authors additional activities
   */
  _multiSaveActivityGeneration({
    text,
    primarySave = null,
    skipFirstSection = true,
    noSpellslot = false,
    sectionDamage = true,
    targetOverrideForSection = null,
    maxExtras = DDBActivityFactoryMixin.MULTI_SAVE_MAX_EXTRAS,
  }: {
    text: string;
    primarySave?: I5eActivitySave | null;
    /** false when the primary activity describes something else - a weapon attack, say - and every section is an extra */
    skipFirstSection?: boolean;
    noSpellslot?: boolean;
    sectionDamage?: boolean;
    targetOverrideForSection?: ((section: string) => I5eActivityTarget | null) | null;
    maxExtras?: number;
  }): void {
    if (this._multiSaveGenerated) return;
    this._multiSaveGenerated = true;
    if (!this.enricher.addAutoAdditionalActivities) return;
    // an enricher that authors its own extras
    if ((this.enricher.additionalActivities ?? []).length > 0) return;
    if (!text?.trim()) return;

    const outlines: IAdditionalActivityOutline[] = [];
    const sections = this._saveBearingSections(text);

    if (sections.length >= 2) {
      for (const { slice, save } of skipFirstSection ? sections.slice(1) : sections) {
        const name = DDBActivityFactoryMixin.multiSaveActivityName(slice.rawLabel)
          || DDBActivityFactoryMixin.multiSaveFallbackName(save);
        outlines.push(DDBActivityFactoryMixin.#multiSaveOutline({
          name, save, section: slice.section, noSpellslot, sectionDamage, targetOverrideForSection,
        }));
      }
    } else {
      const flatSaves = DDBDescriptions.parseSaves(DDBDescriptions.stripTables(text));
      // one save is the document's own; this only reshapes documents that describe several
      if (new Set(flatSaves.map((save) => DDBDescriptions.saveKey(save))).size < 2) return;
      const seen = new Set<string>();
      if (primarySave) seen.add(DDBDescriptions.saveKey(primarySave));
      for (const save of flatSaves) {
        const key = DDBDescriptions.saveKey(save);
        if (seen.has(key)) continue;
        seen.add(key);
        outlines.push(DDBActivityFactoryMixin.#multiSaveOutline({
          name: DDBActivityFactoryMixin.multiSaveFallbackName(save),
          save,
          section: null,
          noSpellslot,
          sectionDamage,
          targetOverrideForSection,
        }));
      }
    }

    if (outlines.length === 0) return;
    if (outlines.length > maxExtras) {
      logger.debug(`Skipping multi-save activity generation for ${this.name}: ${outlines.length} extra saves is a table or an enricher job`, {
        names: outlines.map((outline) => outline.name),
      });
      return;
    }

    logger.debug(`Generating ${outlines.length} additional save activities for ${this.name}`, { outlines });
    this.additionalActivities.push(...outlines);
  }

  static #multiSaveOutline({ name, save, section, noSpellslot, sectionDamage, targetOverrideForSection }: {
    name: string;
    save: IParsedSave;
    section: string | null;
    noSpellslot: boolean;
    sectionDamage: boolean;
    targetOverrideForSection: ((section: string) => I5eActivityTarget | null) | null;
  }): IAdditionalActivityOutline {
    const damageParts = section && sectionDamage
      ? DDBDescriptions.parseDamageParts(section).parts
      : [];
    const targetOverride = section && targetOverrideForSection
      ? targetOverrideForSection(section)
      : null;

    return {
      type: ACTIVITY_TYPES.SAVE,
      name,
      options: {
        generateSave: true,
        generateDamage: damageParts.length > 0,
        generateActivation: true,
        generateTarget: true,
        generateConsumption: false,
        includeBaseDamage: false,
        damageParts,
        onSave: save.half ? "half" : "none",
        saveOverride: {
          ability: save.ability,
          dc: { calculation: save.dc.calculation, formula: save.dc.formula },
        },
        ...(targetOverride ? { targetOverride } : {}),
        ...(noSpellslot ? { noSpellslot: true } : {}),
      },
    };
  }

  _escapeCheckGeneration(): void {
    const escape = this.ddbDefinition.description.match(/escape DC ([0-9]+)/);
    if (escape) {
      const escape = this.ddbDefinition.description.match(/escape DC ([0-9]+)/);
      if (escape) {
        this.additionalActivities.push({
          type: ACTIVITY_TYPES.CHECK,
          name: `Escape Check`,
          options: {
            generateCheck: true,
            generateTarget: false,
            generateRange: false,
            noSpellslot: true,
            checkOverride: {
              "associated": [
                "acr",
                "ath",
              ],
              "ability": [],
              "dc": {
                "calculation": "",
                "formula": escape[1],
              },
            },
          },
        });
      }
    }
  }

  _studyCheckGeneration(): void {
    const studyRegex = /takes (the|a) Study action to examine/i;
    const match = this.ddbDefinition.description.match(studyRegex);
    if (match) {
      this.additionalActivities.push({
        type: ACTIVITY_TYPES.CHECK,
        name: `Study Check`,
        options: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          noSpellslot: true,
          checkOverride: {
            "associated": [
              "inv",
            ],
            "ability": [],
            "dc": {
              "calculation": "spellcasting",
              "formula": "",
            },
          },
          activationOverride: {
            "type": "special",
            "override": true,
            "condition": "Study Action to Investigate",
          },
          rangeOverride: {
            units: "any",
            "override": true,
          },
          targetOverride: {
            affects: {
              "type": "self",
            },
            "override": true,
          },
          durationOverride: {
            "units": "inst",
            "override": true,
          },
        },
      });
    }
  }

}
