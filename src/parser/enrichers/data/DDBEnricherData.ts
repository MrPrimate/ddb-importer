import { DICTIONARY } from "../../../config/_module";
import logger from "../../../lib/Logger";
import utils from "../../../lib/Utils";
import DDBDataUtils from "../../lib/DDBDataUtils";
import * as DDBTemplateStrings from "../../lib/DDBTemplateStrings";
import SpellDataUtils from "../../spells/SpellDataUtils";
import type DDBSummonsManager from "../../companions/DDBSummonsManager";
import { AutoEffects, BehaviorHelper, ChangeHelper, SRDEffects } from "../effects/_module";

export interface IDDBBasicDamage {
  number?: number | null;
  denomination?: number | null;
  type?: string | null;
  types?: string[];
  bonus?: string;
  scalingMode?: "whole" | "half" | "none";
  scalingNumber?: number | null;
  scalingFormula?: string | number;
  customFormula?: string | null;
  /** dnd5e 6 die-modifier suffixes appended to the die term, e.g. ["r1"] -> "1d8r1". */
  modifiers?: string[];
}

export default abstract class DDBEnricherData<T extends TDDBEnricher = TDDBEnricher> {

  // Static getters, not fields
  static get AutoEffects(): typeof AutoEffects {
    return AutoEffects;
  }

  static get BehaviorHelper(): typeof BehaviorHelper {
    return BehaviorHelper;
  }

  static get SRDEffects(): typeof SRDEffects {
    return SRDEffects;
  }

  static get ChangeHelper(): typeof ChangeHelper {
    return ChangeHelper;
  }
  static ACTIVITY_TYPES = DICTIONARY.parsing.activity.types;
  static SPELL_PROPERTIES = DICTIONARY.spell.components;

  ddbEnricher: T;
  ddbParser: TDDBParsers;
  is2014: boolean;
  is2024: boolean;
  useLookupName: boolean;
  activityGenerator: TActivityGenerator | null;
  effectType: string;
  document: any;
  name: string;
  isCustomAction: boolean;
  manager: DDBSummonsManager | null;

  constructor({ ddbEnricher }: { ddbEnricher: T }) {
    this.ddbEnricher = ddbEnricher;
    this.ddbParser = ddbEnricher.ddbParser;
    // enrichers are constructed after load(); before that the enricher flags are null
    this.is2014 = ddbEnricher.is2014 ?? false;
    this.is2024 = ddbEnricher.is2024 ?? !this.is2014;
    this.useLookupName = ddbEnricher.useLookupName;
    this.activityGenerator = ddbEnricher.activityGenerator;
    this.effectType = ddbEnricher.effectType;
    this.document = ddbEnricher.document;
    this.name = ddbEnricher.name ?? "";
    this.isCustomAction = ddbEnricher.isCustomAction;
    this.manager = ddbEnricher.manager;
  }

  getFeatureActionsName({ type = null }: { type?: IActionTypes | null } = {}): IDDBFeatureActionMatches {
    return this.ddbEnricher.getFeatureActionsName({ type });
  }

  get parentIdentifier(): string {
    const parent = this.ddbEnricher.findActionParent("feat");
    const parentName = parent ? parent.definition.name : this.name;
    return DDBDataUtils.classIdentifierName(parentName);
  }

  hasClassFeature({ featureName, className = null, subClassName = null }: { featureName: string; className?: string | null; subClassName?: string | null } = { featureName: "" }): boolean {
    if (!this.ddbParser?.ddbData) return false;

    return DDBDataUtils.hasClassFeature({
      ddbData: this.ddbParser.ddbData,
      featureName,
      className,
      subClassName,
    });
  }

  /**
   * The parsed description of another class feature on this character, for enrichers that fold a
   * sibling feature's text into their own document. Returns null when the feature is absent or the
   * character has not reached its level.
   */
  getClassFeatureDescription({ featureName, className = null, subClassName = null }: { featureName: string; className?: string | null; subClassName?: string | null }): string | null {
    if (!this.ddbParser?.ddbData) return null;

    const feature = DDBDataUtils.getClassFeature({
      ddbData: this.ddbParser.ddbData,
      featureName,
      className,
      subClassName,
    });

    if (!feature?.definition.description) return null;

    const rawCharacter = this.ddbParser.rawCharacter;
    if (rawCharacter?.type !== "character") return feature.definition.description;

    return DDBTemplateStrings.parse(
      this.ddbParser.ddbData,
      rawCharacter,
      feature.definition.description,
      this.ddbParser.ddbFeature,
    )?.text ?? null;
  }

  /**
   * The parsed description of a DDB action on this character, for enrichers whose document folds in
   * an action's text (the default action match copies activities but not descriptions). Returns null
   * when the action is absent.
   */
  getActionDescription({ name, type = "class" }: { name: string; type?: IActionTypes }): string | null {
    const action = this.hasAction({ name, type });
    if (!action?.description) return null;

    const rawCharacter = this.ddbParser.rawCharacter;
    if (rawCharacter?.type !== "character") return action.description;

    return DDBTemplateStrings.parse(
      this.ddbParser.ddbData,
      rawCharacter,
      action.description,
      this.ddbParser.ddbFeature,
    )?.text ?? null;
  }

  hasSpeciesTrait({ traitName }: { traitName: string }): boolean {
    if (!this.ddbParser?.ddbData) return false;

    return DDBDataUtils.hasSpeciesTrait({
      ddbData: this.ddbParser.ddbData,
      traitName,
    });
  }

  get isAction(): boolean {
    return this.ddbParser.isAction ?? false;
  }

  isClass(name: string): boolean {
    return this.ddbParser.klass === name;
  }

  isSubclass(name: string): boolean {
    return this.ddbParser.subKlass === name || this.ddbParser.subClass === name;
  }

  hasSubclass(name: string): boolean {
    if (!this.ddbParser?.ddbData) return false;
    return DDBDataUtils.hasSubClass({
      ddbData: this.ddbParser.ddbData,
      subClassName: name,
    });
  }

  getClassIdentifier(name: string): string {
    return DDBDataUtils.classIdentifierName(name);
  }

  hasAction({ name, type }: { name: string; type: IActionTypes }): IDDBAction | undefined {
    return this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      a.name === name,
    );
  }

  _getSpentValue(type: IActionTypes, name: string, matchSubClass: string | null = null, includesName = false): number | null {
    const spent = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId)?.definition.name === matchSubClass),
    )?.limitedUse?.numberUsed ?? null;
    return spent;
  }

  _getMaxValue(type: IActionTypes, name: string, matchSubClass: string | null = null, includesName = false): number | null {
    const max = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId)?.definition.name === matchSubClass),
    )?.limitedUse?.maxUses ?? null;
    return max;
  }

  _getGeneratedUses({ type, name, matchSubClass = null, scaleLink = null, includesName = false }: {
    type: IActionTypes;
    name: string;
    matchSubClass?: string | null;
    scaleLink?: string | null;
    includesName?: boolean;
  } = { type: "" as IActionTypes, name: "" }): I5eSystemLimitedUses {
    const action = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId)?.definition.name === matchSubClass),
    );

    if (!action) {
      logger.warn(`No action found generating uses for "${name}" (${type})`, { this: this });
      return {};
    }

    const uses: I5eSystemLimitedUses = DDBDataUtils.getLimitedUses({
      // getLimitedUses treats a null limitedUse and an empty object identically
      data: action.limitedUse ?? ({} as IDDBActionLimitedUse),
      description: action.description,
      scaleValue: scaleLink
        ?? ((foundry.utils.getProperty(this.ddbParser, "useUsesScaleValueLink") && foundry.utils.getProperty(this.ddbParser, "scaleValueUsesLink"))
          ? foundry.utils.getProperty(this.ddbParser, "scaleValueUsesLink") as string
          : null),
    }) ?? {};
    return uses;
  }

  _getUsesWithSpent({ type, name, max = null, defaultSpent = null, period = "", formula = null, override = null, matchSubClass = null, includesName = false }: { type: IActionTypes; name: string; max?: string | null; defaultSpent?: number | null; period?: TLimitedUsePeriod; formula?: string | null; override?: boolean | null; matchSubClass?: string | null; includesName?: boolean }): I5eSystemLimitedUses {
    const uses: I5eSystemLimitedUses = {};

    // dnd5e's spent is a non-nullable NumberField, so only set it if we have a value
    const spent = this._getSpentValue(type, name, matchSubClass, includesName) ?? defaultSpent;
    if (spent !== null) uses.spent = spent;

    if (max) uses.max = max;

    if (formula) {
      uses.recovery = [{ period, type: "formula", formula }];
    } else if (period != "") {
      uses.recovery = [{ period, type: "recoverAll", formula: undefined }];
    }

    if (!max) {
      // a null max would stringify to the literal "null", which is not a valid formula
      const maxValue = this._getMaxValue(type, name, matchSubClass, includesName);
      if (maxValue === null) {
        logger.warn(`No max uses found for "${name}" (${type})`, { this: this });
      } else {
        uses.max = String(maxValue);
      }
    }

    if (override) {
      uses.override = true;
    }

    return uses;
  }

  _getSpellsForFeature({ type, name, onlyLimitedUse = true }: { type: IActionTypes; name: string; onlyLimitedUse?: boolean }): any[] {
    const ddbData = this.ddbParser?.ddbData;
    if (!ddbData) return [];
    const spells = (ddbData.character.spells[type] ?? []).filter((s) => {
      if (onlyLimitedUse && !s.limitedUse) return false;
      const id = type === "class"
        ? DDBDataUtils.determineActualFeatureId(ddbData, s.componentId)
        : s.componentId;
      const lookupType = type === "class" ? "classFeature" : type;
      const lookup = SpellDataUtils.getDDBSpellLookup(ddbData, lookupType, id);
      if (lookup?.name === name) return true;
      return false;
    });
    return spells;
  }

  _getSpellUsesWithSpent({ type, name, max = null, defaultSpent = null, period = "", formula = null, override = null }: { type: IActionTypes; name: string; max?: string | null; defaultSpent?: number | null; period?: TLimitedUsePeriod; formula?: string | null; override?: boolean | null }): I5eSystemLimitedUses {
    const spells = this._getSpellsForFeature({ type, name });

    if (spells.length === 0) {
      logger.error(`No spells found for feature ${name} of type ${type}`);
      return {
        spent: defaultSpent,
        max,
        recovery: [],
      };
    }

    const uses: I5eSystemLimitedUses = SpellDataUtils.getUses(spells[0].limitedUse);

    if (formula) {
      uses.recovery = [{ period, type: "formula", formula }];
    } else if (period != "") {
      uses.recovery = [{ period, type: "recoverAll", formula: undefined }];
    }

    if (override) {
      uses.override = true;
    }

    return uses;
  }

  _buildDamagePartsWithBase(): any[] {
    const original = this.ddbEnricher.originalActivity;

    const base = foundry.utils.deepClone(this.data.system.damage.base);
    const parts = foundry.utils.deepClone((foundry.utils.getProperty(original ?? {}, "damage.parts") as I5eDamagePart[]) ?? []);
    return [base, ...parts];
  }


  static allDamageTypes(exclude: string[] = []): string[] {
    return DICTIONARY.actions.damageType
      .filter((d) => d.name !== null)
      .map((d) => d.name)
      .filter((d: string) => !exclude.includes(d));
  }

  static basicDamagePart({
    number = null, denomination = null, type = null, types = [], bonus = "", scalingMode = "whole",
    scalingNumber = 1, scalingFormula = "", customFormula = null, modifiers = [],
  }: IDDBBasicDamage = {}): I5eDamagePart {
    return {
      number,
      denomination,
      bonus,
      types: type ? [type] : types,
      custom: {
        enabled: customFormula !== null,
        // dnd5e's FormulaField coerces null to "" so this is output equivalent
        formula: customFormula ?? "",
      },
      // omitted when empty so unmodified parts keep their existing shape
      ...(modifiers.length > 0 ? { modifiers } : {}),
      scaling: {
        mode: scalingMode,
        number: scalingNumber,
        formula: `${scalingFormula}`,
      },
    };
  }

  // DDB sheet instructions are now stripped centrally in DDBFeatureMixin.getDescription,
  // so this is only needed for notes whose phrasing is not in DDB_SHEET_NOTE_MARKERS.
  static stripBuilderNote(html: string, builderNote = "Character Builder"): string {
    return utils.stripNoteBlocks(html, [builderNote]);
  }

  get useMidiAutomations(): boolean {
    if (!DDBEnricherData.AutoEffects.effectModules().midiQolInstalled) return false;
    return this.ddbParser.useMidiAutomations ?? false;
  }

  get featureType(): string | undefined {
    return foundry.utils.getProperty(this.data, "flags.ddbimporter.type") as string | undefined;
  }

  get type(): IDDBActivityType | null {
    return null;
  }

  get data(): any {
    return this.ddbEnricher.ddbParser.data;
  }

  get activity(): IDDBActivityData | null {
    return null;
  }

  get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return null;
  }

  get generateSummons(): boolean {
    return false;
  }

  get effects(): IDDBEffectHint[] {
    return [];
  }

  get override(): IDDBOverrideData | null {
    return null;
  }

  get additionalActivities(): Partial<IDDBAdditionalActivity>[] | null {
    return null;
  }

  get additionalAdvancements(): I5eAdvancement[] {
    return [];
  }

  get documentStub(): IDDBDocumentStub | null {
    return null;
  }

  get usesOnActivity(): boolean {
    return false;
  }

  get clearAutoEffects(): boolean {
    return false;
  }

  get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  get addToDefaultAdditionalActivities(): boolean {
    return false;
  }

  get addAutoAdditionalActivities(): boolean {
    return true;
  }

  get builtFeaturesFromActionFilters(): any[] {
    return [];
  }

  get stopDefaultActivity(): boolean {
    return false;
  }

  get parseAllChoiceFeatures(): boolean {
    return false;
  }

  /**
   * Suppress the per-choice child features, keeping the options as description text on the
   * parent. The class-scoped equivalent of NO_CHOICE_BUILD, for names that are shared between
   * classes and so cannot be listed there (e.g. Gunslinger vs Fighter "Maneuvers").
   */
  get noChoiceBuild(): boolean {
    return false;
  }

  /**
   * Refuse the option modifiers that DDBFeatureMixin._suppressedChoiceModifiers would otherwise
   * carry onto this feature, for a parent whose enricher automates those options itself. Order of
   * the Lycan: Improved Predatory Strikes/Stalker's Prowess.
   */
  get noSuppressedChoiceModifiers(): boolean {
    return false;
  }

  get itemMacro(): IDDBItemMacro | null {
    return null;
  }

  get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag | null {
    return null;
  }

  get combineGrantedDamageModifiers(): boolean {
    return false;
  }

  get combineDamageTypes(): boolean {
    return false;
  }

  async customFunction(_options: ICustomFunctionOptions = { name: null, activity: null }): Promise<void> {
    // noop
  }

  async cleanup(_options: any = {}): Promise<void> {
    // noop
  }

  get ddbMacroDescriptionData(): IDDBMacroDescriptionData | null {
    return null;
  }

  get noVersatile(): boolean {
    return false;
  }

  get choiceComponentFeatureName(): string | null {
    return null;
  }

  get identifier(): string | null {
    return null;
  }

}
