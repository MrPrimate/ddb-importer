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
    [key: string]: any;
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
    activationType?: string;
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
    data?: Partial<IActivityData>;
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
    mode?: string;
    makeMagical?: boolean;
  }

  // -- Macro Change Inputs ----------------------------------------------------

  export interface IDDBMacroChange {
    macroValues?: string;
    macroType?: string;
    macroName?: string;
    keyPostfix?: string;
    priority?: number;
    ddbFunctions?: boolean | null;
    functionCall?: string | null;
    functionParams?: string;
  }

  export interface IDDBOnUseMacroChange {
    macroPass: string;
    macroType?: string;
    macroName?: string;
    document?: any;
    priority?: number;
    macroParams?: string;
    functionCall?: string | null;
    functionParams?: string;
  }

  export interface IDDBDamageBonusMacroChange {
    macroType?: string;
    macroName?: string;
    document?: any;
    priority?: number;
    functionCall?: string | null;
  }

  export interface IDDBTargetUpdateMacroChange {
    macroPass?: string;
    macroType?: string;
    macroName?: string;
    document: any;
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
    macroType?: string;
    macroName?: string;
    document?: any;
    priority?: number;
    macroParams?: string;
    functionCall?: string | null;
    functionParams?: string;
  }

  // -- Effect Options ---------------------------------------------------------

  export interface IDDBEffectOptions {
    description?: string;
    durationSeconds?: number;
    durationRounds?: number;
    transfer?: boolean;
    disabled?: boolean;
    [key: string]: any;
  }

  // -- Aura Effects -----------------------------------------------------------

  export type IDDBAuraEffects = Record<string, any>;

  // -- Effect Hint ------------------------------------------------------------

  export interface IDDBEffectHint {
    // Creation control
    noCreate?: boolean;
    raw?: Record<string, any>;
    type?: string;

    // Naming & data
    name?: string;
    data?: IEffectData;
    options?: IDDBEffectOptions;

    // Changes
    changes?: IActiveEffectChangeData[];
    changesOverwrite?: boolean;
    atlChanges?: IActiveEffectChangeData[];
    tokenMagicChanges?: IActiveEffectChangeData[];
    midiChanges?: IActiveEffectChangeData[];
    daeChanges?: IActiveEffectChangeData[];

    // DAE
    daeStackable?: string;
    daeSpecialDurations?: DAESpecialDuration[];

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

  export interface IDDBOverrideData {
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
    uses?: I5eSystemLimitedUses;
    // To Do add a data object here with flags
    data?: Record<string, any>;
    midiManualReaction?: boolean;
    midiDamageReaction?: boolean;
    func?: (params: { enricher: any }) => void | Promise<void>;
  }

  // -- Additional Activities --------------------------------------------------

  export interface IDDBActivityAction {
    name: string;
    type: "race" | "class" | "feat" | "item" | "spell";
    isAttack?: boolean | null;
    rename?: string[] | null;
    id?: string | null;
  }

  export interface IDDBActivityInit {
    name: string;
    type: IDDBActivityType;
  }


  //  BuildOptions: {
  //   activationOverride?: any;
  //   additionalTargets?: I5eConsumptionTarget[];
  //   allowCritical?: boolean | null;
  //   attackData?: any;
  //   spellOverride?: I5eActivitySpell | null;
  //   chatFlavor?: string | null;
  //   checkOverride?: I5eActivityCheck | null;
  //   consumeActivity?: boolean;
  //   consumeItem?: boolean;
  //   consumptionOverride?: I5eActivityConsumption | null;
  //   consumptionTargetOverrides?: I5eConsumptionTarget[] | null;
  //   criticalDamage?: string | null;
  //   damageParts?: I5eDamagePart[] | null;
  //   damageScalingOverride?: any;
  //   data?: IActivityData;
  //   ddbMacroOverride?: IDDBActivityMacro | null;
  //   durationOverride?: I5eActivityDuration | null;
  //   generateActivation?: boolean;
  //   generateAttack?: boolean;
  //   generateSpell?: boolean;
  //   generateCheck?: boolean;
  //   generateConsumption?: boolean;
  //   generateDamage?: boolean;
  //   generateDDBMacro?: boolean;
  //   generateDescription?: boolean;
  //   generateDuration?: boolean;
  //   generateEffects?: boolean;
  //   generateEnchant?: boolean;
  //   generateHealing?: boolean;
  //   generateRange?: boolean;
  //   generateRoll?: boolean;
  //   generateSave?: boolean;
  //   generateSummon?: boolean;
  //   generateTarget?: boolean;
  //   generateUses?: boolean;
  //   healingChatFlavor?: string | null;
  //   healingPart?: I5eDamagePart;
  //   img?: string | null;
  //   includeBaseDamage?: boolean;
  //   noeffect?: boolean;
  //   noManualActivation?: boolean;
  //   onSave?: string | null;
  //   partialDamageParts?: I5eDamagePart[] | null;
  //   rangeOverride?: I5eActivityRange | null;
  //   rollOverride?: I5eActivityRoll | null;
  //   saveOverride?: I5eActivitySpell | null;
  //   targetOverride?: I5eActivityTarget | null;
  //   usesOverride?: I5eSystemLimitedUses | null;
  // }

  export interface IDDBActivityBuild {
    // --- Activation / attack ---
    activationOverride?: I5eActivityActivation;
    attackData?: any;
    noManualActivation?: boolean;

    // --- Additional targets / consumption ---
    additionalTargets?: any[];
    consumeActivity?: any;
    consumeItem?: any;
    consumptionOverride?: I5eActivityConsumption;
    consumptionTargetOverrides?: I5eConsumptionTarget[];

    // --- Damage ---
    allowCritical?: boolean | null;
    criticalDamage?: string | null;
    damageParts?: I5eDamagePart[] | null;
    damageScalingOverride?: any;
    includeBaseDamage?: boolean;
    onSave?: string | null;
    /** @deprecated use onSave */
    onsave?: boolean | string;
    partialDamageParts?: I5eDamagePart[];

    // --- Description / flavor ---
    chatFlavor?: string | null;
    data?: IActivityData;
    img?: string | null;

    // --- Duration / range / target ---
    durationOverride?: I5eActivityDuration;
    rangeOverride?: I5eActivityRange;
    targetOverride?: I5eActivityTarget;

    // --- Save / spell / check ---
    checkOverride?: I5eActivityCheck;
    saveOverride?: I5eActivitySave;
    spellOverride?: I5eActivitySpell;

    // --- Healing ---
    healingChatFlavor?: string | null;
    healingPart?: I5eDamagePart;

    // --- Roll ---
    rollOverride?: I5eActivityRoll;

    // --- Uses ---
    usesOverride?: I5eSystemLimitedUses;

    // --- Macro ---
    ddbMacroOverride?: IDDBActivityMacro;

    // --- Spell-specific ---
    modRestrictionFilter?: any;
    modRestrictionFilterExcludes?: any;
    noSpellslot?: boolean;

    // --- Generate flags ---
    generateActivation?: boolean;
    generateAttack?: boolean;
    generateCheck?: boolean;
    generateConsumption?: boolean;
    generateDamage?: boolean;
    generateDDBMacro?: boolean;
    generateDescription?: boolean;
    generateDuration?: boolean;
    generateEffects?: boolean;
    generateEnchant?: boolean;
    generateHealing?: boolean;
    generateRange?: boolean;
    generateRoll?: boolean;
    generateSave?: boolean;
    generateSpell?: boolean;
    generateSummon?: boolean;
    generateTarget?: boolean;
    generateUses?: boolean;
    generateUtility?: boolean;
    generateCast?: boolean;

    // --- Misc flags ---
    noeffect?: boolean;
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
    overrides?: Partial<IDDBActivityData>;
  }

  // -- Document Stub ----------------------------------------------------------

  export interface IDDBDocumentStub {
    stopDefaultActivity?: boolean;
    replaceDefaultActivity?: boolean;
    data?: Record<string, any>;
    documentType?: string;
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
    type?: string;
    name?: string;
    macroType?: string;
    macroName?: string;
  }

  // -- Set MIDI On Use Macro Flag ---------------------------------------------

  export interface IDDBSetMidiOnUseMacroFlag {
    type?: string;
    name?: string;
    macroType?: string;
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
