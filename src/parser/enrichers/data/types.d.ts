import { DICTIONARY } from "../../../config/_module";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STATUSES = DICTIONARY.effects.statuses;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ACTIVITY_TYPES = DICTIONARY.parsing.activity.types;

export { };


// ---------------------------------------------------------------------------
// Type definitions for DDBEnricherData
// ---------------------------------------------------------------------------


// -- Damage Parts -----------------------------------------------------------

global {

  // Construct-signature for enricher class-maps (ENRICHERS / FALLBACK_ENRICHERS / GENERIC_ENRICHERS).
  // DDBEnricherData is abstract, so `typeof DDBEnricherData` is not newable. we use a construct signature
  // matching the base constructor `{ ddbEnricher }`, which concrete subclasses are assignable to.
  // The type parameter narrows the enricher a map's entries are constructed with, so enricher-specific
  // data classes (e.g. DDBEnricherData<DDBClassFeatureEnricher>) fit their owning enricher's maps.
  export type EnricherConstructor<T extends TDDBEnricher = TDDBEnricher> = new (args: { ddbEnricher: T }) => DDBEnricherData;

  // Typed view over a two-deep enricher namespace (e.g. ClassEnrichers, MonsterEnrichers)
  // indexed by runtime strings; `| undefined` keeps missing-key guards honest.
  export type TEnricherGroupMap = Record<string, Record<string, EnricherConstructor | undefined> | undefined>;

  export type IDDBActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

  // -- Summon Profile Keys ----------------------------------------------------

  export interface IDDBSummonProfileKeyLevel {
    min?: number | null;
    max?: number | null;
  }

  export interface IDDBSummonProfileKey {
    name: string;
    count: number | string;
    level?: IDDBSummonProfileKeyLevel;
  }

  // -- Summons Configuration --------------------------------------------------


  export interface IDDBSummonsData {
    match?: IDDBSummonsMatch;
    bonuses?: IDDBSummonsBonuses;
  }

  // -- Activity Parent Lookup -------------------------------------------------

  export interface IDDBActivityParentLookup extends Partial<IDDBActivityData> {
    lookupName: string;
  }

  // -- Activity Data (main getter) --------------------------------------------

  export interface IDDBActivityData {
    name?: string;
    id?: string;
    type?: string;
    parent?: IDDBActivityParentLookup[];

    // Consume targets
    noConsumeTargets?: boolean;
    addItemConsume?: boolean;
    itemConsumeTargetName?: string;
    itemConsumeValue?: string | number;
    addScalingMode?: "" | "amount" | "level" | string;
    addScalingFormula?: string;

    addActivityConsume?: boolean;
    activityConsumeValue?: string | number;
    addActivityScalingMode?: "" | "amount" | "level" | string;
    addActivityScalingFormula?: string;

    addSpellSlotConsume?: boolean;
    removeSpellSlotConsume?: boolean;
    noSpellslot?: boolean;
    spellSlotConsumeTarget?: string;
    spellSlotConsumeValue?: string | number;
    addSpellSlotScalingMode?: "" | "amount" | "level" | string;
    addSpellSlotScalingFormula?: string;

    additionalConsumptionTargets?: I5eConsumptionTarget[];
    addConsumptionScalingMax?: string | number;

    // Targeting
    targetType?: string;
    targetCount?: string | number;
    targetChoice?: boolean;
    targetSelf?: boolean;
    rangeSelf?: boolean;
    rangeType?: string;
    rangeValue?: number | null;
    rangeSpecial?: string;
    noTemplate?: boolean;
    overrideTemplate?: boolean;
    overrideTarget?: boolean;
    overrideRange?: boolean;

    // Activation
    activationType?: TActivationCost;
    activationValue?: number;
    activationCondition?: string;
    overrideActivation?: boolean;

    // MIDI reaction helpers
    midiManualReaction?: boolean;
    midiDamageReaction?: boolean;
    midiHealingReaction?: boolean;
    midiSaveReaction?: boolean;
    midiUseCondition?: string;

    // Attack
    flatAttack?: string;

    // Damage
    removeDamageParts?: boolean;
    damageParts?: I5eDamagePart[];
    allowCritical?: boolean;

    // Restrictions
    allowMagical?: boolean;
    noeffect?: boolean;

    // Data merge & function
    data?: Partial<I5eActivity>;
    func?: (params: { activity: any }) => void | Promise<void>;

    // Summons
    profileKeys?: IDDBSummonProfileKey[];
    summons?: IDDBSummonsData;

    // Spell parsing flags
    addSingleFreeUse?: boolean;
    addSingleFreeRecoveryPeriod?: string;
    additionalDamageIncludeBase?: boolean;
    stopHealSpellActivity?: boolean;
    splitDamage?: boolean;
    addSpellUuid?: string;
  }

  // -- Magical Bonus ----------------------------------------------------------

  export interface IDDBMagicalBonus {
    nameAddition?: string | null;
    bonus?: string | number | null;
    mode?: TActiveEffectChangeType;
    makeMagical?: boolean;
  }

  // -- Macro Change Inputs ----------------------------------------------------

  export interface IDDBMacroChange {
    macroValues?: string;
    macroType?: TDDBMacroType;
    macroName?: string;
    keyPostfix?: string;
    priority?: number;
    ddbFunctions?: boolean | null;
    functionCall?: string | null;
    functionParams?: string;
  }

  export interface IDDBOnUseMacroChange {
    macroPass: string;
    macroType?: TDDBMacroType;
    macroName?: string;
    document?: any;
    priority?: number;
    macroParams?: string;
    functionCall?: string | null;
    functionParams?: string;
  }

  export interface IDDBDamageBonusMacroChange {
    macroType?: TDDBMacroType;
    macroName?: string;
    document?: any;
    priority?: number;
    functionCall?: string | null;
  }

  export interface IDDBTargetUpdateMacroChange {
    macroPass?: string;
    macroType?: TDDBMacroType;
    macroName?: string;
    document: TDDBImporterDocument;
    priority?: number;
    macroParams?: string;
    functionCall?: string | null;
    functionParams?: string;
  }

  export interface IDDBMidiOptionalChange {
    name: string;
    priority?: number;
    data: Record<string, string | number>;
  }

  export interface IDDBOptionalMacroChange {
    optionPostfix: string;
    macroPass?: string | null;
    macroType?: TDDBMacroType;
    macroName?: string;
    document?: any;
    priority?: number;
    macroParams?: string;
    functionCall?: string | null;
    functionParams?: string;
  }

  // -- Effect Options ---------------------------------------------------------
  interface IDDBEffectOptions {
    description?: string;
    durationSeconds?: number | null;
    durationRounds?: number | null;
    durationTurns?: number | null;
    transfer?: boolean;
    disabled?: boolean;
    expiry?: TDAEEffectExpiryTypes;
    showIcon?: TEffectShowIcon;
  }

  // -- Aura Effects -----------------------------------------------------------

  type IDDBAuraEffects = Record<string, any>;

  // -- Effect Hint ------------------------------------------------------------

  interface IDDBEffectHint {
    // Creation control
    noCreate?: boolean;
    raw?: Record<string, any>;
    type?: string;

    // Naming & data
    name?: string;
    img?: string;
    data?: I5eEffectData;
    options?: IDDBEffectOptions;

    // Changes
    changes?: IActiveEffectChangeData[];
    changesOverwrite?: boolean;
    atlChanges?: IActiveEffectChangeData[];
    tokenMagicChanges?: IActiveEffectChangeData[];
    midiChanges?: IActiveEffectChangeData[];
    daeChanges?: IActiveEffectChangeData[];
    /** changes only injected when automated-conditions-5e is active */
    ac5eChanges?: IActiveEffectChangeData[];

    // DAE
    daeStackable?: string;
    daeSpecialDurations?: TDAESpecialDuration[];

    // Status effects
    statuses?: typeof STATUSES;
    riderStatuses?: string[];

    // Activity matching
    activityMatch?: string;
    activitiesMatch?: string[];
    ignoreTransfer?: boolean;

    // MIDI
    midiProperties?: Record<string, any>;
    midiOptionalChanges?: IDDBMidiOptionalChange[];
    optionalMacroChanges?: IDDBOptionalMacroChange[];
    onUseMacroChanges?: IDDBOnUseMacroChange[];
    macroChanges?: IDDBMacroChange[];
    targetUpdateMacroChanges?: IDDBTargetUpdateMacroChange[];
    damageBonusMacroChanges?: IDDBDamageBonusMacroChange[];

    // Auras
    auraeffects?: IDDBAuraEffects;

    // Enchant
    magicalBonus?: IDDBMagicalBonus;
    descriptionHint?: boolean | string;

    // Module conditional flags
    daeOnly?: boolean;
    daeNever?: boolean;
    ac5eOnly?: boolean;
    ac5eNever?: boolean;
    atlOnly?: boolean;
    atlNever?: boolean;
    midiOnly?: boolean;
    midiNever?: boolean;
    activeAurasOnly?: boolean;
    activeAurasNever?: boolean;
    auraeffectsOnly?: boolean;
    auraeffectsNever?: boolean;
    aurasOnly?: boolean;
    aurasNever?: boolean;

    // Function
    func?: (params: { effect: any }) => void | Promise<void>;
  }

  // -- Override Data ----------------------------------------------------------

  interface IDDBOverrideData {
    noTemplate?: boolean;
    removeDamage?: boolean;
    rangeSelf?: boolean;
    replaceActivityUses?: boolean;
    forceSpellAdvancement?: boolean;
    descriptionSuffix?: string;
    ddbMacroDescription?: boolean;
    retainResourceConsumption?: boolean;
    ignoredConsumptionActivities?: string[];
    retainOriginalConsumption?: boolean;
    retainChildUses?: boolean;
    retainUseSpent?: boolean;
    uses?: I5eSystemLimitedUses | I5eConsumableUses;
    // To Do add a data object here with flags
    data?: Record<string, any>;
    midiManualReaction?: boolean;
    midiDamageReaction?: boolean;
    func?: (params: { enricher: any }) => void | Promise<void>;
  }

  // -- Additional Activities --------------------------------------------------

  export interface IDDBActivityAction {
    name: string;
    type: IActionTypes;
    isAttack?: boolean | null;
    rename?: string[] | null;
    // DDB action ids are numbers; some hand-written hints use strings
    id?: string | number | null;
    activityKeysLimited?: string[] | null;
  }

  export interface IDDBActivityInit {
    name: string;
    type: IDDBActivityType;
    id?: string | null;
  }

  export interface IDDBAdditionalActivity {
    // Pattern 1: Duplicate existing activity
    duplicate?: boolean;

    // Pattern 2: Build from DDB action
    action?: IDDBActivityAction;

    // Pattern 3: Build from scratch
    init?: IDDBActivityInit;
    build?: IDDBActivityBuild;

    // Common
    id?: string | null;
    overrides?: IDDBActivityData;
  }

  // -- Document Stub ----------------------------------------------------------

  export interface IDDBDocumentStub {
    stopDefaultActivity?: boolean;
    replaceDefaultActivity?: boolean;
    data?: Record<string, any>;
    documentType?: T5eInventoryTypes | TFeatureType | "spell";
    parsingType?: string;
    systemType?: {
      value: string;
      baseItem?: string;
    };
    copySRD?: {
      name: string;
      type: string;
      uuid?: string;
    };
  }

  // -- Item Macro -------------------------------------------------------------

  export interface IDDBItemMacro {
    type?: TDDBMacroType;
    name?: string;
    macroType?: TDDBMacroType;
    macroName?: string;
  }

  // -- Set MIDI On Use Macro Flag ---------------------------------------------

  export interface IDDBSetMidiOnUseMacroFlag {
    type?: TDDBMacroType;
    name?: string;
    macroType?: TDDBMacroType;
    macroName?: string;
    triggerPoints?: string[];
    functionCall?: string | null;
  }

  // -- Macro Description Data -------------------------------------------------

  export interface IDDBMacroDescriptionData {
    name: string;
    type: string;
    label?: string;
    parameters?: string;
  }
}
