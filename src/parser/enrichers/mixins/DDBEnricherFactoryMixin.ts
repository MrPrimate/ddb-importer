import { utils, logger, DDBEffectImporter, DDBMacros, CompendiumHelper } from "../../../lib/_module";
import DDBSummonsManager from "../../companions/DDBSummonsManager";
import { resolveTransformProfileUuids } from "../../companions/types/TransformProfiles";
import { DDBDataUtils, DDBDescriptions, DDBTemplateStrings } from "../../lib/_module";
import { AutoEffects, EnchantmentEffects, ChangeHelper, EffectGenerator } from "../effects/_module";
import type DDBCharacter from "../../DDBCharacter";
import type DDBEnricherData from "../data/DDBEnricherData";

interface IActivityDataStructure {
  activities: Record<string, I5eActivity>;
  effects: I5eEffectData[];
  advancements: I5eAdvancement[];
  nameData?: Record<string, string[]>;
}

interface IDelegateSpec {
  default: (self: DDBEnricherFactoryMixin<any>) => any;
  // If true, use the default value when the loaded enricher gives an
  // undefined value. Only additionalActivities sets this option.
  coalesceMissing?: boolean;
}

// Each row in this table makes one delegate getter. The loop after the
// class body installs the getters. The interface after the class body
// declares their types. Each default value is a function. A function
// result is a new array or object on each read.
const DELEGATED_GETTERS = {
  type: { default: () => null },
  activity: { default: () => null },
  effects: { default: () => [] },
  override: { default: () => null },
  additionalActivities: { default: () => [], coalesceMissing: true },
  additionalAdvancements: { default: () => [] },
  useDefaultAdditionalActivities: { default: (self) => !self.isAction },
  usesOnActivity: { default: () => false },
  documentStub: { default: () => null },
  clearAutoEffects: { default: () => false },
  addAutoAdditionalActivities: { default: () => true },
  addToDefaultAdditionalActivities: { default: () => false },
  builtFeaturesFromActionFilters: { default: () => [] },
  itemMacro: { default: () => null },
  setMidiOnUseMacroFlag: { default: () => null },
  stopDefaultActivity: { default: () => false },
  parseAllChoiceFeatures: { default: () => false },
  noChoiceBuild: { default: () => false },
  ddbMacroDescriptionData: { default: () => null },
  summonsFunction: { default: () => null },
  generateSummons: { default: () => false },
  noVersatile: { default: () => false },
  choiceComponentFeatureName: { default: () => null },
  identifier: { default: () => null },
  combineGrantedDamageModifiers: { default: () => false },
  combineDamageTypes: { default: () => false },
} satisfies Partial<Record<keyof DDBEnricherData, IDelegateSpec>>;

// The interface after the class body declares the delegate getters. The
// defineProperty loop installs all of these getters at run time. Thus the
// declaration merge is safe.
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
abstract class DDBEnricherFactoryMixin<THint = string> {

  NAME_HINTS_2014: Record<string, THint> = {};
  NAME_HINT_2014_INCLUDES: Record<string, string> = {};
  NAME_HINTS: Record<string, THint> = {};
  NAME_HINT_INCLUDES: Record<string, string> = {};
  // Kept as `any` deliberately: this is the permissive supertype that subclasses narrow.
  // The mixin consumes ENRICHERS flat (`new this.ENRICHERS[hint]`) while some subclasses
  // (e.g. DDBMonsterFeatureEnricher) override it with a nested shape; tightening the base to
  // either shape would break the other subclass's property override. Subclasses type their own
  // maps with `Record<string, EnricherConstructor>` (see data/DDBEnricherData.ts).
  abstract ENRICHERS: Record<string, any>;
  abstract FALLBACK_ENRICHERS: Record<string, any>;

  ddbParser: TDDBParsers;
  document: IEnricherItems;
  name: string | null;
  isCustomAction: boolean;
  activityGenerator: TActivityGenerator | null;
  is2014: boolean | null;
  is2024: boolean | null;
  useLookupName: boolean;
  effectType: string;
  enricherType: string;
  fallbackEnricher: string | null;
  manager: DDBSummonsManager | null;
  loadedEnricher: DDBEnricherData | null;
  _originalActivity: I5eActivity | null;
  notifier: NotifierV1 | null;
  hintName: string | null;
  defaultActionFeatures: Record<string, any>;
  customActionFeatures: Record<string, any>;
  // "spell" used by the spell enricher; the actions map itself is keyed by IActionTypes
  ddbActionType: IActionTypes | "spell" | null;
  // set when _buildFeaturesFromAction generates a matching feature
  activityNameMatchFeature: Record<string, any> | null;

  _loadEnricherData(): DDBEnricherData | null {
    const isHomebrew = foundry.utils.getProperty(this.ddbParser, "ddbDefinition.isHomebrew");
    if (isHomebrew) return null;
    if (!this.ENRICHERS?.[this.hintName!]) {
      if (utils.isFunction((this as any)._defaultNameLoader)) return (this as any)._defaultNameLoader();
      return null;
    }
    return new this.ENRICHERS[this.hintName!]({
      ddbEnricher: this,
    });
  }

  _loadFallbackEnricherData(): void {
    if (!this.fallbackEnricher) return;
    if (!this.FALLBACK_ENRICHERS[this.fallbackEnricher]) return;
    const loadedEnricher = new this.FALLBACK_ENRICHERS[this.fallbackEnricher]({
      ddbEnricher: this,
    });
    this.loadedEnricher = loadedEnricher;
  }

  _getEnricherMatches(): void {
    const loadedEnricher = this._loadEnricherData();
    if (!loadedEnricher) {
      this._loadFallbackEnricherData();
      return;
    }
    this.loadedEnricher = loadedEnricher;
  }

  _getNameHint(): void {
    if (this.isCustomAction) return;
    const raw = (this.is2014 ? this.NAME_HINTS_2014[this.name!] : null)
      ?? this.NAME_HINTS[this.name!];
    if (typeof raw === "string") {
      this.hintName = raw;
      return;
    }

    if (this.is2014) {
      const keys = Object.keys(this.NAME_HINT_2014_INCLUDES);
      const hint = keys.find((key) => this.name!.includes(key));
      if (hint) {
        this.hintName = this.NAME_HINT_2014_INCLUDES[hint];
        return;
      }
    }

    const keys = Object.keys(this.NAME_HINT_INCLUDES);
    const hint = keys.find((key) => this.name!.includes(key));
    if (hint) {
      this.hintName = this.NAME_HINT_INCLUDES[hint];
      return;
    }

    this.hintName = this.name;
  }

  async _prepare(): Promise<void> {
    this._getNameHint();
    this._getEnricherMatches();
    if (!this.ddbParser.isAction && !this.ddbParser.forceDefaultActionBuild) {
      await this._buildDefaultActionFeatures();
    }
  }

  get ddbMacroDescription(): string {
    const data = this.ddbMacroDescriptionData;
    if (!data) return "";

    //   name: "fontOfMagic",
    //   label: "Font of Magic Macro", // optional
    //   type: "spell",
    //   parameters: "", // optional
    // };

    const parameters = data.parameters
      ? ` functionParams="${data.parameters}`
      : "";
    const label = data.label
      ? `{${data.label}}`
      : "";

    return `<hr><div class="ddb-macros-container"><p>[[/ddbifunc functionName="${data.name}" functionType="${data.type}"${parameters}]]${label}</div></p></div>`;
  }

  constructor({
    activityGenerator = null, effectType = "basic", enricherType = "general", notifier = null, fallbackEnricher = null,
    ddbActionType = null,
  }: {
    activityGenerator?: TActivityGenerator | null;
    effectType?: string;
    enricherType?: string;
    notifier?: NotifierV1 | null;
    fallbackEnricher?: string | null;
    ddbActionType?: IActionTypes | "spell" | null;
  } = {}) {
    // parser and document are null until load() provides them; the types stay
    // non-null as the enricher contract is load-before-use throughout
    this.ddbParser = null as unknown as TDDBParsers;
    this.document = null as unknown as IEnricherItems;
    this.name = null;
    this.isCustomAction = false;
    this.activityGenerator = activityGenerator;
    this.is2014 = null;
    this.is2024 = null;
    this.useLookupName = false;
    this.effectType = effectType;
    this.enricherType = enricherType;
    this.fallbackEnricher = fallbackEnricher;
    this.manager = null;
    this.loadedEnricher = null;
    this._originalActivity = null;
    this.notifier = notifier;
    this.hintName = null;
    this.defaultActionFeatures = {};
    this.customActionFeatures = {};
    this.ddbActionType = ddbActionType;
    this.activityNameMatchFeature = null;
  }

  async load({
    ddbParser,
    document,
    name = null,
    is2014 = null,
    fallbackEnricher = null,
  }: {
    ddbParser?: TDDBParsers;
    document?: IEnricherItems;
    name?: string | null;
    is2014?: boolean | null;
    fallbackEnricher?: string | null;
  } = {}): Promise<void> {
    if (fallbackEnricher) this.fallbackEnricher = fallbackEnricher;
    // all call sites pass a parser; document-only loads are the theoretical fallback
    this.ddbParser = ddbParser ?? (null as unknown as TDDBParsers);
    const doc = ddbParser?.data ?? document;
    if (!doc) logger.warn("DDBEnricher.load called without a parser or document", { name });
    this.document = doc ?? (null as unknown as IEnricherItems);
    this.name = ddbParser?.originalName ?? name ?? doc?.flags?.ddbimporter?.originalName ?? doc?.name ?? null;
    this.isCustomAction = doc?.flags?.ddbimporter?.isCustomAction ?? false;
    this.is2014 = is2014 ?? this.ddbParser?.is2014 ?? doc?.flags?.ddbimporter?.is2014 ?? false;
    this.is2024 = !this.is2014;
    this.useLookupName = false;
    await this._prepare();
  }

  async init(): Promise<void> {
    this.manager = new DDBSummonsManager({ notifier: this.notifier });
    await this.manager.init();
  }

  get data(): IEnricherItems {
    return this.ddbParser?.data ?? this.document;
  }

  set data(data: IEnricherItems) {
    if (this.ddbParser?.data) this.ddbParser.data = data;
    else if (this.document) this.document = data;
  }

  get originalActivity(): I5eActivity | null {
    return this._originalActivity;
  }

  set originalActivity(activity: I5eActivity | null) {
    this._originalActivity = activity;
  }

  get isAction(): boolean {
    return this.ddbParser.isAction ?? false;
  }

  static async getCompendiumSpellUuidsFromNames(names: string[], { use2024Spells }: { use2024Spells?: boolean; getDocuments?: boolean } = {}): Promise<ICompendiumLookup[]> {
    const spellChoice = utils.getSetting<string>("munching-policy-force-spell-version");
    const spells = await CompendiumHelper.retrieveCompendiumSpellReferences(names, {
      use2024Spells: (use2024Spells ?? spellChoice === "FORCE_2024"),
    });

    return spells;
  }


  async _addCompendiumSpellToCastActivity(spell: string, activity: I5eCastActivity, { use2024Spells = false }: { use2024Spells?: boolean } = {}): Promise<I5eCastActivity> {
    const spellIndex = await DDBEnricherFactoryMixin.getCompendiumSpellUuidsFromNames([spell], { use2024Spells });
    if (!spellIndex || spellIndex.length === 0) {
      logger.warn(`No compendium spell found for ${spell}`);
      return activity;
    }

    foundry.utils.setProperty(activity, "spell.uuid", spellIndex[0].uuid);

    return activity;

  }

  // The single setting gate for enricher-driven snippet handling; the two
  // strategies below assume the gate has already been applied.
  _applyActivitySnippet(activity: IActivityData, overrideData: IDDBActivityData): void {
    if (utils.getSetting<boolean>("add-ddb-snippets-to-activities") !== true) return;
    const hint = overrideData.useActivitySnippet;
    const section = hint && hint !== true ? hint.section : undefined;
    if (section) {
      this._applyActivitySectionSnippet(activity, overrideData, section);
    } else if (hint) {
      this._applySelectedActionSnippet(activity, hint);
    } else {
      this._applyActivitySectionSnippet(activity, overrideData);
    }
  }

  _applySelectedActionSnippet(activity: IActivityData, hint: true | IDDBActivitySnippetLookup): void {
    const lookup = hint === true ? {} : hint;
    const name = lookup.name ?? activity.name?.trim();
    const type = lookup.type ?? (foundry.utils.getProperty(this.ddbParser, "type") as IActionTypes | undefined);
    if (!name || !type) {
      logger.debug(`Unable to resolve an action lookup for a ${this.ddbParser?.originalName} activity snippet`, {
        lookup,
        activity,
        this: this,
      });
      return;
    }
    const actions = this._getActivityActions({ name, type });
    if (actions.length === 0) {
      // A missing action is a normal state - it usually hangs off a builder
      // toggle the character has switched off - and the inherited parent
      // snippet still covers the card.
      logger.debug(`No "${name}" ${type} action found for ${this.ddbParser.originalName}; its activity snippet was not applied`, {
        name,
        type,
        this: this,
      });
      return;
    }
    if (actions.length > 1) {
      logger.warn(`Multiple "${name}" ${type} actions found for ${this.ddbParser.originalName}; using the first activity snippet`, {
        name,
        type,
        actions,
        this: this,
      });
    }
    const action = actions[0];
    const source = action.snippet?.trim() || action.description?.trim() || "";
    if (!source) return;
    const value = DDBTemplateStrings.parseSnippet({
      ddbData: this.ddbParser.ddbData,
      rawCharacter: this.ddbParser.rawCharacter,
      text: source,
      feature: action,
    });
    foundry.utils.setProperty(activity, "description.value", value);
  }

  /**
   * Narrow an inherited whole-document snippet down to the section that describes the activity.
   * An enricher can name that section outright when the activity name does not
   * resemble it. otherwise the activity's own name is looked up.
   */
  _applyActivitySectionSnippet(activity: IActivityData, overrideData: IDDBActivityData, sectionName?: string): void {
    const rawCharacter = this.ddbParser?.rawCharacter;
    if (rawCharacter?.type !== "character") return;
    if (foundry.utils.hasProperty(overrideData, "data.description.value")) return;

    const activityName = sectionName?.trim() || activity.name?.trim();
    const definition = this.ddbParser.ddbDefinition;
    if (!activityName || !definition) return;

    const ddbData = this.ddbParser.ddbData;
    const feature = this.ddbParser.ddbFeature ?? definition;
    const parse = (source: string): string =>
      DDBTemplateStrings.parseSnippet({ ddbData, rawCharacter, text: source, feature });

    // Do not replace a description authored by an enricher/activity builder.
    const existing = foundry.utils.getProperty(activity, "description.value") as string | undefined;
    if (existing?.trim()) {
      const normalizedExisting = DDBDescriptions.normalizeSectionLabel(existing);
      const inheritedSources = [
        foundry.utils.getProperty(this.ddbParser, "snippet") as string | undefined,
        definition.snippet,
      ].filter((source): source is string => Boolean(source?.trim()));
      const matchesInherited = inheritedSources.some((source) =>
        DDBDescriptions.normalizeSectionLabel(source) === normalizedExisting
        || DDBDescriptions.normalizeSectionLabel(parse(source)) === normalizedExisting,
      );
      if (!matchesInherited) return;
    }

    const sources = [
      definition.snippet,
      definition.description,
      foundry.utils.getProperty(this.ddbParser, "snippet") as string | undefined,
      foundry.utils.getProperty(this.ddbParser, "description") as string | undefined,
    ].filter((source): source is string => Boolean(source?.trim()));

    // An action document's own snippet already describes the action, so it must not be
    // swapped for a section describing that same thing, only for one describing something
    // else. THis is how a secondary activity  e.g. ("Autumn (Save)") finds its rules.
    // Explicit sections are always honoured.
    const documentName = this.ddbParser.isAction && !sectionName
      ? DDBDescriptions.normalizeSectionLabel(this.ddbParser.originalName ?? definition.name ?? "")
      : "";

    for (const source of new Set(sources)) {
      const match = DDBDescriptions.matchActivitySection(source, activityName, {
        exactOnly: Boolean(sectionName),
      });
      if (!match) continue;
      if (documentName !== "" && match.label === documentName) continue;
      foundry.utils.setProperty(activity, "description.value", parse(match.section));
      return;
    }

    if (sectionName) {
      // 2014 and 2024 source variants ship different snippets
      logger.debug(`No "${sectionName}" section found for ${this.ddbParser.originalName}`, {
        activity,
        this: this,
      });
    }
  }

  async _applyActivityDataOverride(activity: IActivityData, overrideData: IDDBActivityData): Promise<I5eActivity> {
    if (overrideData.name) activity.name = overrideData.name;
    if (overrideData.id) activity._id = overrideData.id;

    if (overrideData.parent) {
      for (const parent of overrideData.parent) {
        const lookupName = foundry.utils.getProperty(this.data, "flags.ddbimporter.dndbeyond.lookupName");
        if (lookupName !== parent.lookupName) continue;

        // TODO check this still works right?
        const base = foundry.utils.deepClone(overrideData) as IDDBActivityData;
        delete base.parent;
        overrideData = foundry.utils.mergeObject(base, parent) as unknown as IDDBActivityData;
      }
    }

    this._applyActivitySnippet(activity, overrideData);

    if (overrideData.noConsumeTargets) {
      foundry.utils.setProperty(activity, "consumption.targets", []);
      // an explicit opt-out must not be undone by the deferred consumption
      // reconciliation in DDBFeatureMixin._final()
      const awaitingUses = foundry.utils.getProperty(this.ddbParser ?? {}, "_activitiesAwaitingUses") as Set<string> | undefined;
      if (activity._id) awaitingUses?.delete(activity._id);
    }
    if (overrideData.addItemConsume) {
      const consumptionTargets: I5eConsumptionTarget[] = [{
        type: "itemUses",
        target: overrideData.itemConsumeTargetName ?? "",
        value: overrideData.itemConsumeValue ?? "1",
        scaling: {
          mode: overrideData.addScalingMode ?? "",
          formula: overrideData.addScalingFormula ?? "",
        },
      }];
      foundry.utils.setProperty(activity, "consumption.targets", consumptionTargets);
      if (overrideData.itemConsumeTargetName && overrideData.itemConsumeTargetName !== "") {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.replaceActivityUses", true);
      }
    }
    if (overrideData.addActivityConsume) {
      const consumptionTargets = (foundry.utils.getProperty(activity, "consumption.targets") as I5eConsumptionTarget[] | undefined) ?? [];
      consumptionTargets.push({
        type: "activityUses",
        target: "",
        value: overrideData.activityConsumeValue ?? "1",
        scaling: {
          mode: overrideData.addActivityScalingMode ?? "",
          formula: overrideData.addActivityScalingFormula ?? "",
        },
      });
      foundry.utils.setProperty(activity, "consumption.targets", consumptionTargets);
    }
    if (overrideData.addSpellSlotConsume) {
      const consumptionTargets = (foundry.utils.getProperty(activity, "consumption.targets") as I5eConsumptionTarget[] | undefined) ?? [];
      consumptionTargets.push({
        type: "spellSlots",
        target: overrideData.spellSlotConsumeTarget ?? "",
        value: overrideData.spellSlotConsumeValue ?? "1",
        scaling: {
          mode: overrideData.addSpellSlotScalingMode ?? "",
          formula: overrideData.addSpellSlotScalingFormula ?? "",
        },
      });
      foundry.utils.setProperty(activity, "consumption.targets", consumptionTargets);
    }

    if (overrideData.additionalConsumptionTargets) {
      const consumptionTargets = (foundry.utils.getProperty(activity, "consumption.targets") as I5eConsumptionTarget[] | undefined) ?? [];
      consumptionTargets.push(...overrideData.additionalConsumptionTargets);
      foundry.utils.setProperty(activity, "consumption.targets", consumptionTargets);
    }

    if (overrideData.addConsumptionScalingMax !== undefined) {
      foundry.utils.setProperty(activity, "consumption.scaling", {
        allowed: true,
        max: overrideData.addConsumptionScalingMax,
      });
    }

    if (overrideData.removeSpellSlotConsume || overrideData.noSpellslot) {
      foundry.utils.setProperty(activity, "consumption.spellSlot", false);
    }

    if (overrideData.targetSelf) {
      foundry.utils.setProperty(activity, "target.affects.type", "self");
    }

    if (overrideData.targetType) {
      if (activity.target?.affects) {
        foundry.utils.setProperty(activity, "target.affects.type", overrideData.targetType);
        if (overrideData.targetCount) {
          foundry.utils.setProperty(activity, "target.affects.count", overrideData.targetCount);
        }
        if (overrideData.targetChoice) {
          foundry.utils.setProperty(activity, "target.affects.choice", overrideData.targetChoice);
        }
      } else {
        foundry.utils.setProperty(activity, "target", {
          template: {
            count: "",
            contiguous: false,
            type: "",
            size: "",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: overrideData.targetCount ?? "",
            type: overrideData.targetType,
            choice: overrideData.targetChoice ?? false,
            special: "",
          },
          prompt: true,
        });
      }
      if ([undefined, null, ""].includes(foundry.utils.getProperty(activity, "range.units") as string)) {
        foundry.utils.setProperty(activity, "range", {
          value: null,
          units: "self",
          special: "",
        });
      }
    }

    if (overrideData.rangeType) {
      foundry.utils.setProperty(activity, "range", {
        value: overrideData.rangeValue ?? null,
        units: overrideData.rangeType,
        special: overrideData.rangeSpecial ?? "",
      });
    }

    if (overrideData.rangeSelf) {
      foundry.utils.setProperty(activity, "range", {
        value: null,
        units: "self",
        special: "",
      });
    }

    if (overrideData.noTemplate) {
      foundry.utils.setProperty(activity, "target.template", {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      });
      foundry.utils.setProperty(activity, "target.prompt", false);
      // blanking the activity's own template is not enough: dnd5e's `_setOverride`
      // merges the ITEM's target over any activity whose `target.override` is false,
      // putting the spell's template straight back. An activity that wants no
      // template has to own its target block.
      foundry.utils.setProperty(activity, "target.override", true);
    }

    if (overrideData.overrideTemplate || overrideData.overrideTarget)
      foundry.utils.setProperty(activity, "target.override", true);

    if (overrideData.overrideRange)
      foundry.utils.setProperty(activity, "range.override", true);

    if (overrideData.activationType) {
      activity.activation = {
        type: overrideData.activationType,
        value: overrideData.activationValue ?? activity.activation?.value ?? 1,
        condition: overrideData.activationCondition ?? activity.activation?.condition ?? "",
      };
    } else if (overrideData.activationValue) {
      foundry.utils.setProperty(activity, "activation.value", overrideData.activationValue);
    }
    if (overrideData.activationCondition) {
      foundry.utils.setProperty(activity, "activation.condition", overrideData.activationCondition);
    }

    if (overrideData.overrideActivation)
      foundry.utils.setProperty(activity, "activation.override", true);

    if (overrideData.midiManualReaction && AutoEffects.effectModules().midiQolInstalled)
      activity.useConditionText = "false";

    if (overrideData.midiDamageReaction && AutoEffects.effectModules().midiQolInstalled)
      activity.useConditionText = `reaction == 'isDamaged'`;

    if (overrideData.midiHealingReaction && AutoEffects.effectModules().midiQolInstalled)
      activity.useConditionText = `reaction == 'isHealed'`;

    if (overrideData.midiSaveReaction && AutoEffects.effectModules().midiQolInstalled)
      activity.useConditionText = `reaction == 'isSaveFail'`;

    if (overrideData.midiUseCondition && AutoEffects.effectModules().midiQolInstalled)
      activity.useConditionText = overrideData.midiUseCondition;

    if (foundry.utils.hasProperty(overrideData, "flatAttack")) {
      foundry.utils.setProperty(activity, "attack.bonus", overrideData.flatAttack);
      foundry.utils.setProperty(activity, "attack.flat", true);
    }

    if (overrideData.removeDamageParts) {
      foundry.utils.setProperty(activity, "damage.parts", []);
    }

    if (overrideData.damageParts) {
      const damageParts = (foundry.utils.getProperty(activity, "damage.parts") as Partial<I5eDamagePart>[] | undefined) ?? [];
      foundry.utils.setProperty(activity, "damage.parts", damageParts.concat(overrideData.damageParts));
    }

    const isSummon = activity.type === "summon" || overrideData.type === "summon";

    if (isSummon) {
      foundry.utils.setProperty(activity, "midiProperties", {
        autoTargetAction: "none",
        confirmTargets: "never",
      });
    }

    if (overrideData.profileKeys && isSummon && this.manager) {
      this.manager.addProfilesToActivity(activity as I5eSummonActivity, overrideData.profileKeys, overrideData.summons);
    }

    if (overrideData.allowCritical) {
      foundry.utils.setProperty(activity, "damage.critical.allow", true);
    }

    if (overrideData.data) {
      const data = utils.isFunction(overrideData.data)
        ? overrideData.data()
        : overrideData.data;
      activity = foundry.utils.mergeObject(activity, data);
      if (Array.isArray(activity.behaviors)) {
        // ddbMacro region automation is opt-in via the hidden world setting
        const allowMacros = utils.getSetting<boolean>("enable-ddb-macro-region-behaviors") === true;
        const auraeffectsInstalled = AutoEffects.effectModules().auraeffectsInstalled;
        const ac5eInstalled = AutoEffects.effectModules().ac5eInstalled;
        activity.behaviors = activity.behaviors.filter((behavior: I5eActivityBehavior) => {
          if (behavior.type === "ddbMacro" && !allowMacros) return false;
          if (behavior.ddbimporter?.auraeffectsOnly && !auraeffectsInstalled) return false;
          if (behavior.ddbimporter?.auraeffectsNever && auraeffectsInstalled) return false;
          if (behavior.ddbimporter?.ac5eOnly && !ac5eInstalled) return false;
          if (behavior.ddbimporter?.ac5eNever && ac5eInstalled) return false;
          return true;
        });
        for (const behavior of activity.behaviors) delete behavior.ddbimporter;
      }
    }

    if (
      activity.type === "transform"
      && activity.transform?.mode === ""
      && Array.isArray(activity.profiles)
    ) {
      await resolveTransformProfileUuids({ profiles: activity.profiles, is2014: this.is2014 ?? false });
    }

    if (overrideData.addSpellUuid) {
      await this._addCompendiumSpellToCastActivity(overrideData.addSpellUuid, activity as I5eCastActivity, {
        // is2024 is always a boolean after load()
        use2024Spells: this.is2024 ?? false,
      });
    }

    if (overrideData.allowMagical) {
      foundry.utils.setProperty(activity, "restrictions.allowMagical", true);
    }

    if (overrideData.noeffect) {
      const ids = foundry.utils.getProperty(this.data, "flags.ddbimporter.noeffect") as string[] ?? [];
      if (this.data._id) ids.push(this.data._id);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.noEffectIds", ids);
      foundry.utils.setProperty(activity, "flags.ddbimporter.noeffect", true);
    }

    if (overrideData.func) {
      await overrideData.func({ activity });
    }

    return activity as I5eActivity;
  }

  async applyActivityOverride(activityData: any): Promise<any> {
    this.originalActivity = activityData;
    const activity = this.activity;
    if (!activity) return activityData;

    const result = await this._applyActivityDataOverride(activityData, activity);

    return result;
  }

  createDefaultEffects(): void {
    this.data = AutoEffects.forceDocumentEffect(this.data);
    if ((game as any).modules.get("vision-5e")?.active ?? false)
      this.data = AutoEffects.addVision5eStub(this.data);
  }

  get _canApplyMidiEffects(): boolean {
    const addAutomationEffects = this.loadedEnricher?.useMidiAutomations ?? false;
    return addAutomationEffects;
  }

  _ensureEffectChanges(effect: I5eEffectData): IActiveEffectChangeData[] {
    effect.system ??= {};
    effect.system.changes ??= [];
    return effect.system.changes;
  }

  async createEffects(): Promise<I5eEffectData[]> {
    const effectHints = this.effects;
    const effects: I5eEffectData[] = [];

    const applyMidiOnlyEffects = this._canApplyMidiEffects;

    // always set item macros and on use macro flags
    const itemMacro = this.itemMacro;
    if (itemMacro && applyMidiOnlyEffects) {
      const type = itemMacro.type ?? itemMacro.macroType;
      const name = itemMacro.name ?? itemMacro.macroName;
      if (type && name) {
        await DDBMacros.setItemMacroFlag(this.data, type, name);
      } else {
        logger.warn(`Item macro hint missing type or name for ${this.name}`, { itemMacro });
      }
    }

    const setMidiOnUseMacroFlag = this.setMidiOnUseMacroFlag;
    if (setMidiOnUseMacroFlag && applyMidiOnlyEffects) {
      DDBMacros.setMidiOnUseMacroFlagV2({
        document: this.data,
        macroType: setMidiOnUseMacroFlag.macroType ?? setMidiOnUseMacroFlag.type,
        macroName: setMidiOnUseMacroFlag.macroName ?? setMidiOnUseMacroFlag.name,
        triggerPoints: setMidiOnUseMacroFlag.triggerPoints,
        functionCall: setMidiOnUseMacroFlag.functionCall,
      });
    }

    if (!effectHints || effectHints?.length === 0) return effects;

    for (const effectHint of effectHints) {
      if (!effectHint) continue;
      if (effectHint.daeNever && AutoEffects.effectModules().daeInstalled) continue;
      if (effectHint.daeOnly && !AutoEffects.effectModules().daeInstalled) continue;
      if (effectHint.ac5eNever && AutoEffects.effectModules().ac5eInstalled) continue;
      if (effectHint.ac5eOnly && !AutoEffects.effectModules().ac5eInstalled) continue;
      if (effectHint.midiNever && AutoEffects.effectModules().midiQolInstalled) continue;
      if (effectHint.midiOnly && !applyMidiOnlyEffects) continue;
      if (effectHint.auraeffectsNever && AutoEffects.effectModules().auraeffectsInstalled) continue;
      if (effectHint.auraeffectsOnly && !AutoEffects.effectModules().auraeffectsInstalled) continue;
      const name = effectHint.name ?? this.name ?? "";
      const effectOptions = effectHint.options ?? {};

      const dataEffects = this.data.effects ?? [];
      let effect: I5eEffectData;
      let useExistingEffect = false;
      if (effectHint.noCreate && dataEffects.length > 0) {
        effect = dataEffects[0];
        if (effectHint.name) effect.name = effectHint.name;
        if (effectOptions.description) effect.description = effectOptions.description;
        useExistingEffect = true;
      } else if (effectHint.noCreate && effects.length > 0) {
        effect = effects[effects.length - 1];
        useExistingEffect = true;
      } else if (effectHint.raw) {
        effect = foundry.utils.deepClone(effectHint.raw);
        if (effectHint.name) effect.name = effectHint.name;
        if (effectOptions.description) effect.description = effectOptions.description;
      } else {
        switch (effectHint.type ?? this.effectType) {
          case "enchant":
            effect = EnchantmentEffects.EnchantmentEffect(this.data, name, effectOptions);
            if (effectHint.magicalBonus) {
              EnchantmentEffects.addMagicalBonus({
                effect,
                nameAddition: effectHint.magicalBonus.nameAddition,
                bonus: `${effectHint.magicalBonus.bonus}`,
                bonusMode: effectHint.magicalBonus.mode,
                makeMagical: effectHint.magicalBonus.makeMagical,
              });
            }
            break;
          case "feat":
            effect = AutoEffects.FeatEffect(this.data, name, effectOptions);
            break;
          case "spell":
            effect = AutoEffects.SpellEffect(this.data, name, effectOptions);
            break;
          case "monster":
            effect = AutoEffects.MonsterFeatureEffect(this.data, name, effectOptions);
            break;
          case "item":
            effect = AutoEffects.ItemEffect(this.data, name, effectOptions);
            break;
          case "basic":
          default:
            effect = AutoEffects.BaseEffect(this.data, name, effectOptions);
        }

        if (!effectOptions.durationSeconds && !effectOptions.durationRounds) {
          const duration = DDBDescriptions.getDuration(this.data.system.description?.value ?? "", false);
          if (duration.type) {
            if (duration.seconds) {
              foundry.utils.setProperty(effect, "duration.value", duration.seconds);
              foundry.utils.setProperty(effect, "duration.units", "seconds");
              foundry.utils.setProperty(effect, "duration.expiry", "turnStart");
            } else if (duration.rounds) {
              foundry.utils.setProperty(effect, "duration.value", duration.rounds);
              foundry.utils.setProperty(effect, "duration.units", "rounds");
              foundry.utils.setProperty(effect, "duration.expiry", "turnStart");
            }
          }
          const specialDurations: TDAESpecialDuration[] = utils.addArrayToProperties(effect.flags?.dae?.specialDuration ?? [], duration.dae ?? []);
          foundry.utils.setProperty(effect, "flags.dae.specialDuration", specialDurations);
          // description-parsed specials get the native duration.expiry translation too
          if ((duration.dae ?? []).length > 0) {
            effect = EffectGenerator.applyDaeSpecialDurations(effect, specialDurations);
          }
        }

      }

      if (effectHint.statuses) {
        for (const status of effectHint.statuses) {
          const splitStatus = status.split(":");
          ChangeHelper.addStatusEffectChange({
            effect,
            statusName: splitStatus[0],
            level: splitStatus.length > 1 ? parseInt(splitStatus[1]) : null,
          });
        }
      }

      if (effectHint.changes) {
        const changes = effectHint.changes;
        if (effectHint.changesOverwrite) {
          effect.system ??= {};
          effect.system.changes = changes;
        } else {
          this._ensureEffectChanges(effect).push(...changes);
        }
      }

      if (effectHint.tokenChanges) {
        this._ensureEffectChanges(effect).push(...effectHint.tokenChanges);
      }

      if (effectHint.tokenMagicChanges && AutoEffects.effectModules().tokenMagicInstalled) {
        this._ensureEffectChanges(effect).push(...effectHint.tokenMagicChanges);
      }

      if (effectHint.midiChanges && applyMidiOnlyEffects) {
        this._ensureEffectChanges(effect).push(...effectHint.midiChanges);
      }

      if (effectHint.daeChanges && AutoEffects.effectModules().daeInstalled) {
        this._ensureEffectChanges(effect).push(...effectHint.daeChanges);
      }

      if (effectHint.ac5eChanges && AutoEffects.effectModules().ac5eInstalled) {
        this._ensureEffectChanges(effect).push(...effectHint.ac5eChanges);
      }

      if (effectHint.daeStackable) {
        foundry.utils.setProperty(effect, "flags.dae.stackable", effectHint.daeStackable);
      }

      if (effectHint.daeSpecialDurations) {
        effect = EffectGenerator.applyDaeSpecialDurations(effect, effectHint.daeSpecialDurations);
      }

      if (effectHint.midiProperties && applyMidiOnlyEffects) {
        foundry.utils.setProperty(this.data, "flags.midiProperties", effectHint.midiProperties);
      }

      if (effectHint.activityMatch) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.activityMatch", effectHint.activityMatch);
      }

      if (effectHint.activitiesMatch) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.activitiesMatch", effectHint.activitiesMatch);
      }
      if (effectHint.onSave) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.effectOnSave", true);
      }

      if (effectHint.ignoreTransfer) {
        foundry.utils.setProperty(effect, "flags.ddbimporter.ignoreTransfer", effectHint.ignoreTransfer);
      }

      if (effectHint.img) {
        effect.img = effectHint.img;
      }

      if (effectHint.macroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.macroChanges) {
          this._ensureEffectChanges(effect).push(DDBMacros.generateMacroChange(macroChange));
        }
      }

      if (effectHint.onUseMacroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.onUseMacroChanges) {
          this._ensureEffectChanges(effect).push(DDBMacros.generateOnUseMacroChange(macroChange));
        }
      }

      if (effectHint.targetUpdateMacroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.targetUpdateMacroChanges) {
          this._ensureEffectChanges(effect).push(DDBMacros.generateTargetUpdateMacroChange(macroChange));
        }
      }

      if (effectHint.damageBonusMacroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.damageBonusMacroChanges) {
          this._ensureEffectChanges(effect).push(DDBMacros.generateDamageBonusMacroChange(macroChange));
        }
      }

      if (effectHint.optionalMacroChanges && applyMidiOnlyEffects) {
        for (const macroChange of effectHint.optionalMacroChanges) {
          this._ensureEffectChanges(effect).push(DDBMacros.generateOptionalMacroChange(macroChange));
        }
      }

      if (effectHint.midiOptionalChanges && applyMidiOnlyEffects) {
        for (const midiChange of effectHint.midiOptionalChanges) {
          for (const [key, value] of Object.entries(midiChange.data)) {
            this._ensureEffectChanges(effect).push(
              ChangeHelper.customChange(value, midiChange.priority ?? 5, `flags.midi-qol.optional.${midiChange.name}.${key}`),
            );
          }
        }
      }

      if (effectHint.auraeffects && AutoEffects.effectModules().auraeffectsInstalled) {
        effect.system ??= {};
        foundry.utils.mergeObject(effect.system, effectHint.auraeffects);
        effect.type = "auraeffects.aura" as typeof effect.type;
      }

      if (effectHint.data) {
        effect = foundry.utils.mergeObject(effect, effectHint.data);
      }

      if (effectHint?.func) {
        await effectHint.func({ effect });
      }

      if (effectHint.standalone) {
        effect._id = utils.namedIDStub(`${this.data.name} ${effect.name}`, { prefix: "ddb" });
        effect.transfer = false;
        if (effectHint.originReplacement) {
          for (const change of effect.system?.changes ?? []) {
            if (typeof change.value === "string" && change.value.includes("@")) change.replacement = "origin";
          }
        }
        // a noCreate standalone hint MOVES the matched embedded effect into the compendium stash
        if (useExistingEffect) {
          const index = this.data.effects?.indexOf(effect) ?? -1;
          if (index >= 0) this.data.effects?.splice(index, 1);
        }
        const standalone = (foundry.utils.getProperty(this.data, "flags.ddbimporter.standaloneEffects") ?? []) as I5eEffectData[];
        standalone.push(effect);
        foundry.utils.setProperty(this.data, "flags.ddbimporter.standaloneEffects", standalone);
        continue;
      }

      const description = this.data.system.description;
      if (effectHint.descriptionHint && effectHint.type === "enchant" && description) {
        description.value = `${description.value}
  <br>
  <section class="secret">
  <i>This feature provides an enchantment to help provide it's functionality.</i>
  </section>`;
      }

      if (!useExistingEffect) effects.push(effect);
    }

    AutoEffects.forceDocumentEffect(this.data);

    return effects;
  }

  async addDocumentAdvancements(advancementsOverride: I5eAdvancement[] | null = null): Promise<IEnricherItems> {
    const additionalAdvancements = advancementsOverride ?? this.additionalAdvancements;

    if (!additionalAdvancements) return this.data;
    if (!("advancement" in this.data.system)) return this.data;
    if (!this.data.system.advancement) {
      this.data.system.advancement = {};
    }

    for (const advancement of (additionalAdvancements).flat()) {
      if (!advancement._id) {
        logger.warn(`Advancement missing _id for ${this.name}`, { advancement });
        continue;
      }
      this.data.system.advancement[advancement._id] = advancement;
    }
    return this.data;
  }

  async addDocumentOverride(): Promise<IEnricherItems> {
    const override = this.override;

    if (!override) return this.data;
    if (override.removeDamage && "damage" in this.data.system) {
      this.data.system.damage.base = {
        number: null,
        denomination: null,
        bonus: "",
        types: [],
        custom: {
          enabled: false,
          formula: "",
        },
        scaling: {
          mode: "whole",
          number: null,
          formula: "",
        },
      };
    }

    if (override.replaceActivityUses) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.replaceActivityUses", true);
    }

    if (override.rangeSelf) {
      foundry.utils.setProperty(this.data.system, "range", {
        value: null,
        units: "self",
        special: "",
      });
    }

    if (override.noTemplate) {
      foundry.utils.setProperty(this.data.system, "target.template", {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      });
    }

    if (override.forceSpellAdvancement) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.forceSpellAdvancement", true);
    }

    if (override.retainResourceConsumption) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.retainResourceConsumption", true);
    }

    if (override.ignoredConsumptionActivities) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.ignoredConsumptionActivities", override.ignoredConsumptionActivities);
    }

    if (override.noConsumeTargetActivities && "activities" in this.data.system) {
      const awaitingUses = foundry.utils.getProperty(this.ddbParser ?? {}, "_activitiesAwaitingUses") as Set<string> | undefined;
      for (const [id, activity] of Object.entries(this.data.system.activities)) {
        if (!override.noConsumeTargetActivities.includes(activity.name ?? "")) continue;
        foundry.utils.setProperty(activity, "consumption.targets", []);
        awaitingUses?.delete(id);
      }
    }

    if (override.retainOriginalConsumption) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.retainOriginalConsumption", true);
    }

    if (override.retainChildUses) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.retainChildUses", true);
    }

    if (override.retainUseSpent) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.retainUseSpent", true);
    }

    if (override.retainActivityUseSpent) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.retainActivityUseSpent", override.retainActivityUseSpent);
    }

    // an override carrying no data must not wipe the uses the parser generated
    if (override.uses && !foundry.utils.isEmpty(override.uses)) {
      foundry.utils.setProperty(this.data, "system.uses", override.uses);
    }

    if (override.data) this.data = foundry.utils.mergeObject(this.data, override.data);

    const documentDescription = this.data.system.description;
    if (override.descriptionSuffix && documentDescription) {
      documentDescription.value += override.descriptionSuffix;
      if (documentDescription.chat !== "") documentDescription.chat += override.descriptionSuffix;
    }

    if (override.ddbMacroDescription && documentDescription) {
      const description = this.ddbMacroDescription;
      documentDescription.value += description;
      if (documentDescription.chat !== "") documentDescription.chat += description;
    }

    if (override?.func) {
      await override.func({
        enricher: this,
      });
    }

    return this.data;
  }

  _getActivityDataFromDDBParent(activityHint: IDDBAdditionalActivity, i: number, ddbParent: TDDBParsers): IActivityDataStructure {
    const emptyResult: IActivityDataStructure = {
      activities: {},
      effects: [],
      advancements: [],
    };
    const ActivityGenerator = this.activityGenerator;
    if (!ActivityGenerator) {
      logger.warn(`No activity generator available building additional activity for ${this.name}`, { activityHint });
      return emptyResult;
    }
    const activationData = foundry.utils.mergeObject({
      nameIdPrefix: "add",
      nameIdPostfix: `${i}`,
      ddbParent: ddbParent,
    }, activityHint.init);
    activationData.ddbParent = ddbParent;
    const activity = new ActivityGenerator(activationData);
    activity.build(activityHint.build);

    if (activityHint.id) activity.data._id = activityHint.id;

    const activityId = activity.data._id;
    if (!activityId) {
      logger.warn(`Generated activity missing _id for ${this.name}`, { activityHint });
      return emptyResult;
    }

    return {
      activities: {
        [activityId]: activity.data,
      },
      effects: [],
      advancements: [],
    };
  }

  async _getActivityDataFromAction({
    name,
    type,
    isAttack = null,
    rename = null,
    id = null,
    activityKeysLimited = [],
  }: IDDBActivityAction, y: number): Promise<IActivityDataStructure> {
    const result: IActivityDataStructure = {
      activities: {},
      effects: [],
      advancements: [],
    };
    const ddbCharacter = foundry.utils.getProperty(this.ddbParser, "ddbCharacter") as DDBCharacter | undefined;
    if (!ddbCharacter) return result;
    const actions = this._getActivityActions({ name, type });
    if (actions.length === 0) {
      // The enricher asked for an activity DDB did not ship. Either the action hangs off a
      // builder toggle the character has switched off, or DDB renamed it - both leave the
      // feature quietly short an activity, so hardcode the activity rather than name an action.
      logger.warn(`No "${name}" ${type} action found for ${this.ddbParser.originalName}, the activity it would have built is missing`, {
        name,
        type,
        this: this,
      });
      return result;
    }
    const actionFeatures = await Promise.all(actions.map(async (action) => {
      const feature = await ddbCharacter._characterFeatureFactory.getFeatureFromAction({
        action,
        isAttack,
        manager: this.manager,
        extraFlags: foundry.utils.getProperty(this.ddbParser, "extraFlags") as IItemFlagConfig | undefined,
      });
      return feature;
    }));

    const keysLimited = activityKeysLimited ?? [];
    let i = 0;
    for (const feature of actionFeatures) {
      if (!("activities" in feature.system)) continue;
      for (const activityKey of (Object.keys(feature.system.activities))) {
        if (keysLimited.length > 0 && !keysLimited.includes(activityKey)) continue;
        let newKey = id ?? `${activityKey.slice(0, -3)}Ne${y + i}`;
        while (result.activities[newKey] || foundry.utils.hasProperty(this.data, `system.activities.${newKey}`)) {
          newKey = `${activityKey.slice(0, -3)}Ne${y + i + 1}`;
        }
        result.activities[newKey] = foundry.utils.deepClone(feature.system.activities[activityKey]);
        result.activities[newKey]._id = `${newKey}`;
        if (rename) {
          foundry.utils.setProperty(result.activities[newKey], "name", (rename[i] ?? ""));
        } else if (!result.activities[newKey].name) {
          const activityName = name.includes(`:`)
            ? name.split(`:`).pop()!.trim()
            : name;
          result.activities[newKey].name = activityName;
        }
      }
      result.effects.push(...(foundry.utils.deepClone(feature.effects ?? [])));
      result.advancements.push(...(foundry.utils.deepClone(Object.values(feature.system.advancement ?? {}))));
      i++;
    };
    this.customActionFeatures[name] = actionFeatures;
    logger.debug(`Additional Activities from Action ${name}`, { result });
    return result;

  }

  _getActivityActions({ name, type }: { name: string; type: IActionTypes }): IDDBAction[] {
    const ddbCharacter = foundry.utils.getProperty(this.ddbParser, "ddbCharacter") as DDBCharacter | undefined;
    return ddbCharacter?._characterFeatureFactory.getActions({ name, type }) ?? [];
  }

  async _addActivityHintAdditionalActivities(ddbParent: TDDBParsers): Promise<void> {
    const additionalActivityHints = this.additionalActivities;

    if (!additionalActivityHints) return;
    if (!this.activityGenerator) return;
    if (!("activities" in this.data.system)) return;

    let i = Object.keys(this.data.system.activities).length ?? 0 + 1;
    for (const activityHint of additionalActivityHints) {
      const actionActivity = foundry.utils.getProperty(activityHint, "action") as IDDBActivityAction | undefined;
      const duplicate = foundry.utils.getProperty(activityHint, "duplicate") as boolean | undefined ?? false;
      const _id = foundry.utils.getProperty(activityHint, "id") as string | undefined;
      const activityData: IActivityDataStructure = {
        activities: {},
        effects: [],
        advancements: [],
      };

      if (duplicate) {
        const key = Object.keys(this.data.system.activities)[0];
        const activityClone = foundry.utils.deepClone(this.data.system.activities[key]) as I5eActivity;
        activityClone._id = _id ?? `${activityClone._id?.slice(0, -3) ?? ""}clo`;
        activityData.activities[activityClone._id] = activityClone;
      } else if (actionActivity) {
        logger.debug(`Building activity from action ${actionActivity.name}`, { actionActivity, i });
        const result = await this._getActivityDataFromAction(actionActivity, i);
        activityData.activities = result.activities;
        activityData.effects = result.effects;
        activityData.advancements = result.advancements;
      } else {
        const result = this._getActivityDataFromDDBParent(activityHint, i, ddbParent);
        activityData.activities = result.activities;
        activityData.effects = result.effects;
        activityData.advancements = result.advancements;
      }

      for (let activity of Object.values(activityData.activities) as any[]) {
        if (activityHint.overrides) {
          this.originalActivity = activity;
          activity = await this._applyActivityDataOverride(activity, activityHint.overrides);
        } else if (!actionActivity) {
          // Snippet handling only - the full override pipeline has
          // activity-keyed branches (summon midiProperties, transform profile
          // resolution) that must not start firing for hint-built activities.
          this._applyActivitySnippet(activity, {});
        }

        this.data.system.activities[(activity as any)._id] = activity;
        i++;
      }
      if (activityData.effects) {
        this.data.effects ??= [];
        this.data.effects.push(...activityData.effects);
      }
      if (activityData.advancements) {
        this.addDocumentAdvancements(activityData.advancements);
      }
    }
  }

  _addDefaultActionMatchedActivities(): void {
    foundry.utils.setProperty(this.data, "flags.ddbimporter.defaultAdditionalActivities", {
      enabled: true,
      data: {},
    });
    let i = 0;
    for (const [name, features] of Object.entries(this.defaultActionFeatures) as [string, any[]][]) {
      let y = 0;
      for (const feature of features) {
        const nameData: Record<string, string[]> = {};
        const activityData: IActivityDataStructure = {
          activities: {},
          effects: [],
          advancements: [],
          nameData,
        };

        const activityKeys = Object.keys(feature.system.activities);
        const activityCount = activityKeys.length;
        const featureName = foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name;

        logger.debug(`Processing out ${activityCount} default additional activities for ${name}`, {
          feature,
          i,
          y,
          name,
          activityKeys,
          featureName,
        });

        const damageBase = foundry.utils.getProperty(this.data, "system.damage.base") as I5eDamagePart | undefined;
        if (feature.type === "weapon" && this.data.type === "weapon"
          && damageBase
          && !damageBase.bonus
          && !damageBase.number
          && !damageBase.denomination
          && !damageBase.custom?.enabled
        ) {
          foundry.utils.setProperty(this.data, "system.damage.base", foundry.utils.deepClone(feature.system.damage.base));
        }

        for (const activityKey of activityKeys) {
          // slice enough of the original key to keep a valid 16 character id
          const buildKey = (suffix: number): string => `${activityKey.slice(0, -(2 + String(suffix).length))}Ne${suffix}`;
          let suffix = y + i;
          let newKey = buildKey(suffix);
          while (activityData.activities[newKey] || foundry.utils.hasProperty(this.data, `system.activities.${newKey}`)) {
            suffix++;
            newKey = buildKey(suffix);
          }
          activityData.activities[newKey] = foundry.utils.deepClone(feature.system.activities[activityKey]);
          activityData.activities[newKey]._id = `${newKey}`;

          const activityName = activityData.activities[newKey].name;
          if (!activityName || activityName === "") {
            if (activityCount === 1) {
              activityData.activities[newKey].name = featureName;
            } else {
              activityData.activities[newKey].name = `${featureName} (${utils.capitalize(activityData.activities[newKey].type ?? "")})`;
            }
          }
          nameData[newKey] = Array.from(new Set([featureName, activityData.activities[newKey].name]));
        }
        activityData.effects.push(...foundry.utils.deepClone(feature.effects));
        DDBEffectImporter.mergeStandaloneEffects(this.data, feature);

        if (feature.system.advancement) {
          activityData.advancements.push(...(foundry.utils.deepClone(Object.values(feature.system.advancement)) as I5eAdvancement[]));
        }

        // console.warn(`Final activity map`,{
        //   activityData
        // })

        if ("activities" in this.data.system) {
          for (const activity of Object.values(activityData.activities) as any[]) {
            this.data.system.activities[activity._id] = activity;
            i++;
          }
        }
        if (activityData.effects) {
          this.data.effects ??= [];
          this.data.effects.push(...activityData.effects);
        }
        if (activityData.advancements) {
          this.addDocumentAdvancements(activityData.advancements);
        }

        this.data.effects = (this.data.effects ?? []).filter((v: any, i: number, a: any[]) => {
          if (v.name.startsWith("Status:")) {
            return a.findIndex((t) =>
              t.name.startsWith("Status:")
              && t.name === v.name
              && !t.flags?.ddbimporter?.activitiesMatch
              && !t.flags?.ddbimporter?.activityMatch) === i;
          }
          return true;
        });
        // activities cloned from the action documents can link a Status effect
        // the filter above just dropped; retarget those links to the surviving
        // same-named effect so they do not dangle
        if ("activities" in this.data.system) {
          const survivorIdByName = new Map<string, string>();
          const survivingIds = new Set<string>();
          for (const effect of this.data.effects as any[]) {
            if (!effect._id) continue;
            survivingIds.add(effect._id);
            if (effect.name?.startsWith("Status:") && !survivorIdByName.has(effect.name)) {
              survivorIdByName.set(effect.name, effect._id);
            }
          }
          for (const droppedEffect of activityData.effects as any[]) {
            if (!droppedEffect._id || survivingIds.has(droppedEffect._id)) continue;
            const survivorId = survivorIdByName.get(droppedEffect.name);
            if (!survivorId) continue;
            for (const activity of Object.values(this.data.system.activities) as any[]) {
              for (const link of (activity.effects ?? []) as any[]) {
                if (link._id === droppedEffect._id) link._id = survivorId;
              }
            }
          }
        }
        y++;

        for (const effect of activityData.effects) {
          logger.debug(`Adding default additional activity effect for ${name}`, {
            effect,
            this: this,
          });
          const existingEffect = this.data.effects.find((e) => e.name === effect.name && e.name?.startsWith("Status:"));
          if (existingEffect && effect._id && !existingEffect._id) {
            existingEffect._id = effect._id;
          }
        }

        foundry.utils.setProperty(this.data, "flags.ddbimporter.defaultAdditionalActivities.data", {
          featureName,
          activityCount,
          activityKeys: Object.keys(activityData.activities),
          nameMap: activityData.nameData,
        });

      }
    }
  }

  async addAdditionalActivities(ddbParent: TDDBParsers): Promise<void> {
    const useDefaultActivities = this.useDefaultAdditionalActivities;
    const addToDefaultAdditionalActivities = this.addToDefaultAdditionalActivities;

    logger.debug(`Starting additional activities add for ${this.ddbParser.originalName}`, {
      useDefaultActivities,
      addToDefaultAdditionalActivities,
      this: this,
      ddbParent,
    });

    if (useDefaultActivities) {
      logger.debug(`Adding default additional activities for ${this.ddbParser.originalName}`);
      this._addDefaultActionMatchedActivities();
      logger.debug(`Complete adding default additional activities for ${this.ddbParser.originalName}`, {
        this: this,
        data: foundry.utils.deepClone(this.data),
      });
    }

    if (!useDefaultActivities || addToDefaultAdditionalActivities) {
      logger.debug(`Adding custom additional activities for ${this.ddbParser.originalName}`);
      await this._addActivityHintAdditionalActivities(ddbParent);
    }
  }

  findActionParentFromFeat(): IDDBFeat | null {
    if (this.isCustomAction) return null;
    if (!this.ddbParser.isAction) return null;

    const componentId = this.ddbParser.ddbDefinition.componentId;
    const componentTypeId = foundry.utils.getProperty(this.ddbParser.ddbDefinition, "componentTypeId") as number;
    const feats = foundry.utils.getProperty(this.ddbParser, "ddbCharacter.source.ddb.character.feats") as IDDBFeat[] ?? [];

    const feat = feats.find((f) =>
      f.definition.id === componentId
      && f.definition.entityTypeId === componentTypeId,
    );

    if (feat) return feat;

    return null;
  }

  findActionParent(type: string): IDDBFeat | null {
    if (type === "feat" || this.enricherType === "feat") return this.findActionParentFromFeat();
    return null;
  }

  getFeatureActionsName({ type = null }: { type?: IActionTypes | null } = {}): IDDBFeatureActionMatches {
    const results: IDDBFeatureActionMatches = {
      all: [],
      name: [],
      id: [],
      options: [],
      choices: [],
    };

    if (!this.ddbParser?.ddbDefinition) return results;

    const name = this.ddbParser.ddbDefinition.name;
    const id = this.ddbParser.ddbDefinition.id;
    const entityTypeId = foundry.utils.getProperty(this.ddbParser.ddbDefinition, "entityTypeId") as number;
    const derivedType = (type ?? this.ddbActionType ?? this.enricherType) as IActionTypes;

    const actions: IDDBActions = foundry.utils.getProperty(this.ddbParser, "ddbData.character.actions") as IDDBActions;

    if (!actions?.[derivedType]) return results;

    // When building a specific choice/option feature, restrict action matching to actions
    // belonging to THIS option, not sibling options sharing the parent feature id.
    const currentChoice = (foundry.utils.getProperty(this, "ddbParser._currentChoice") ?? null) as IDDBChoiceResult | null;
    const currentChoiceOptionId = currentChoice
      ? (currentChoice.id ?? currentChoice.optionId ?? null)
      : null;

    const nameMatches = this.ddbParser.ddbData.character.actions[derivedType].filter((action) =>
      action.name === name
      && action.componentId === id
      && action.componentTypeId === entityTypeId,
    );

    results.name = nameMatches;

    const idMatches = this.ddbParser.ddbData.character.actions[derivedType].filter((action) =>
      !nameMatches.some((m) => m.id === action.id)
      && action.componentId === id
      && action.componentTypeId === entityTypeId,
    );
    results.id = idMatches;

    const optionMatches = this.ddbParser.ddbData.character.actions[derivedType].filter((action) => {
      const actionComponentId = foundry.utils.getProperty(action, "flags.ddbimporter.componentId");
      const actionComponentTypeId = foundry.utils.getProperty(action, "flags.ddbimporter.componentTypeId");

      const optionMatch = (this.ddbParser.ddbData.character.options[derivedType] ?? []).find((option) =>
        option.definition.id === actionComponentId
        && option.definition.entityTypeId === actionComponentTypeId,
      );

      return optionMatch
        && (currentChoiceOptionId === null || action.componentId === currentChoiceOptionId)
        && !nameMatches.some((m) => m.id === action.id)
        && !idMatches.some((m) => m.id === action.id)
        && optionMatch.componentId === id
        && optionMatch.componentTypeId === entityTypeId;
    });

    results.options = optionMatches;

    if (this.ddbParser.ddbFeature) {
      const choices = DDBDataUtils.getChoices({
        ddb: this.ddbParser.ddbData,
        type: derivedType,
        feat: this.ddbParser.ddbFeature,
        selectionOnly: true,
      });

      // console.warn(`CHOICES`, {
      //   choices,
      //   this: this,
      // });

      const choiceMatches = this.ddbParser.ddbData.character.actions[derivedType].filter((action) => {
        const choiceMatch = choices.some((choice) => choice.id === action.componentId);

        return choiceMatch
          && (currentChoiceOptionId === null || action.componentId === currentChoiceOptionId)
          && !nameMatches.some((m) => m.id === action.id)
          && !idMatches.some((m) => m.id === action.id)
          && !optionMatches.some((m) => m.id === action.id);
      });

      results.choices = choiceMatches;
    }

    results.all = [...nameMatches, ...idMatches, ...optionMatches, ...results.choices];

    // console.warn(`Action match results ${name} (${derivedType})`, results);

    return results;

  }

  /**
   * DDB action names carry curly apostrophes; enrichers list them straight, so
   * compare both through nameString rather than raw.
   */
  _matchesBuiltFeatureFilter(actionName: string): boolean {
    const filters = this.builtFeaturesFromActionFilters as string[];
    if (filters.length === 0) return true;
    return filters.some((filter) => utils.nameString(filter) === utils.nameString(actionName));
  }

  async _buildFeaturesFromAction({ name, type, isAttack = null, id = null }: { name: string; type: IActionTypes; isAttack?: boolean | null; id?: string | number | null }): Promise<T5eFeatureMixinDataTypes[]> {
    const ddbCharacter = this.ddbParser?.ddbCharacter;
    if (!ddbCharacter) return [];
    const f = this._getActivityActions({ name, type })
      .filter((action) => this._matchesBuiltFeatureFilter(action.name));
    const actions = f
      .filter((action) => !id
        || type === "class"
        || String(action.id) === String(id),
      );

    if (f.length !== actions.length) {
      logger.warn(`Filtered actions from ${f.length} to ${actions.length} for ${name} (${type}) do not match`, {
        f,
        actions,
        this: this,
        name,
        type,
        id,
      });
    }
    logger.debug(`Built Actions from Action "${name}" for ${this.ddbParser.originalName}`, { actions, this: this });
    if (actions.length === 0) return [];
    const actionFeatures = await Promise.all(actions.map(async (action) => {
      const generatedActionFeature = await ddbCharacter._characterFeatureFactory.getFeatureFromAction({
        action,
        isAttack,
        manager: this.manager,
        extraFlags: this.ddbParser.extraFlags,
        // usesOnActivity: true,
        // usesOnActivity: action.length > 1,
      });

      const actionFeatureName = foundry.utils.getProperty(generatedActionFeature, "flags.ddbimporter.originalName") ?? generatedActionFeature.name;
      if (this.ddbParser.originalName === actionFeatureName) {
        if (this.activityNameMatchFeature) {
          logger.warn(`Activity Name Match for ${this.ddbParser.originalName} already set`, {
            this: this,
            generatedActionFeature,
            previous: foundry.utils.deepClone(this.activityNameMatchFeature),
          });
        }
        this.activityNameMatchFeature = generatedActionFeature;
      }

      return generatedActionFeature;
    }));

    logger.debug(`Additional Features from Action ${name}`, { actionFeatures });
    return actionFeatures;

  }


  async _buildDefaultActionFeatures({ type = null }: { type?: IActionTypes | null } = {}): Promise<void> {
    const derivedType = type ?? this.ddbActionType ?? this.enricherType;
    if (!derivedType) return;
    const actions = this.getFeatureActionsName({ type: derivedType as IActionTypes });

    const actionsToBuild = actions.all.map((action) => {
      return {
        action: {
          name: action.name,
          type: derivedType,
          id: action.id,
        },
      };
    });

    // console.warn(`Building Features from Actions for ${this.ddbParser.originalName}`, {
    //   type,
    //   derivedType,
    //   actionsToBuild,
    //   actions,
    // });

    let i = 1;
    for (const activityHint of actionsToBuild) {
      const actionActivity = foundry.utils.getProperty(activityHint, "action") as IDDBActivityAction;

      logger.debug(`Building activity from action ${actionActivity.name}`, { actionActivity, i });
      const actionFeatures = await this._buildFeaturesFromAction(actionActivity);
      this.defaultActionFeatures[actionActivity.name] = actionFeatures;

      // console.warn(`Features from actions ${this.ddbParser.originalName}`, {
      //   actionFeatures,
      //   activityHint,
      //   this: this,
      //   activityMatchedFeatures: this.defaultActionFeatures,
      //   i,
      // });
      i++;
    }

    logger.debug(`Default Feature Action Build Complete for ${this.ddbParser.originalName}`, {
      this: this,
      defaultActionFeatures: this.defaultActionFeatures,
    });
  }

  // the null default predates typing; downstream only truthy-checks these fields
  async customFunction(options: ICustomFunctionOptions = { name: null, activity: null }): Promise<void> {
    await this.loadedEnricher?.customFunction(options);
  }

  async cleanup(options: any = {}): Promise<void> {
    await this.loadedEnricher?.cleanup(options);
  }

}

// This loop makes the delegate getters. A getter returns the value from
// the loaded enricher without change. If no enricher is loaded, the getter
// returns the default value from the table. The getters are not
// enumerable. Class accessors are also not enumerable.
// DDBEnricherFactoryMixin.pure.test.ts examines this behavior.
for (const [key, spec] of Object.entries(DELEGATED_GETTERS) as [string, IDelegateSpec][]) {
  Object.defineProperty(DDBEnricherFactoryMixin.prototype, key, {
    get(this: DDBEnricherFactoryMixin<any>) {
      if (this.loadedEnricher) {
        const value = (this.loadedEnricher as any)[key];
        return spec.coalesceMissing ? (value ?? spec.default(this)) : value;
      }
      return spec.default(this);
    },
    configurable: true,
    enumerable: false,
  });
}

// This interface merges with the class. It gives types to the getters
// that the loop above makes. The type of each getter is the same as the
// type of the getter it replaced.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DDBEnricherFactoryMixin<THint = string> {
  readonly type: IDDBActivityType | null;
  readonly activity: IDDBActivityData | null;
  readonly effects: IDDBEffectHint[];
  readonly override: IDDBOverrideData | null;
  readonly additionalActivities: IDDBAdditionalActivity[];
  readonly additionalAdvancements: I5eAdvancement[];
  readonly useDefaultAdditionalActivities: boolean;
  readonly usesOnActivity: boolean;
  readonly documentStub: IDDBDocumentStub | null;
  readonly clearAutoEffects: boolean;
  readonly addAutoAdditionalActivities: boolean;
  readonly addToDefaultAdditionalActivities: boolean;
  readonly builtFeaturesFromActionFilters: any[];
  readonly itemMacro: IDDBItemMacro | null;
  readonly setMidiOnUseMacroFlag: IDDBSetMidiOnUseMacroFlag | null;
  readonly stopDefaultActivity: boolean;
  readonly parseAllChoiceFeatures: boolean;
  readonly noChoiceBuild: boolean;
  readonly ddbMacroDescriptionData: IDDBMacroDescriptionData | null;
  readonly summonsFunction: ((data: ICompanionData) => Promise<ICompanionResult>) | null;
  readonly generateSummons: boolean;
  readonly noVersatile: boolean;
  readonly choiceComponentFeatureName: string | null;
  readonly identifier: string | null;
  readonly combineGrantedDamageModifiers: boolean;
  readonly combineDamageTypes: boolean;
}

export default DDBEnricherFactoryMixin;
