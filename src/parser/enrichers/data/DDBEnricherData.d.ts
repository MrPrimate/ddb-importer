// ---------------------------------------------------------------------------
// Type definitions for DDBEnricherData getter return values
// ---------------------------------------------------------------------------

// -- Damage Parts -----------------------------------------------------------

interface DDBDamagePartCustom {
  enabled: boolean;
  formula: string | null;
}

interface DDBDamagePartScaling {
  mode: "whole" | "half" | "";
  number: number;
  formula: string;
}

interface DDBDamagePart {
  number: number | null;
  denomination: number | null;
  bonus: string;
  types: string[];
  custom: DDBDamagePartCustom;
  scaling: DDBDamagePartScaling;
}

// -- Consumption Targets ----------------------------------------------------

interface DDBConsumptionTargetScaling {
  allowed?: boolean;
  mode?: "" | "amount" | "level";
  max?: string;
  formula?: string;
}

interface DDBConsumptionTarget {
  type: "itemUses" | "activityUses" | "spellSlots" | "attribute" | string;
  target: string;
  value: string | number;
  scaling?: DDBConsumptionTargetScaling;
}

// -- Summon Profile Keys ----------------------------------------------------

interface DDBSummonProfileKeyLevel {
  min: number | null;
  max: number | null;
}

interface DDBSummonProfileKey {
  name: string;
  count: number | string;
  level?: DDBSummonProfileKeyLevel;
}

// -- Summons Configuration --------------------------------------------------

interface DDBSummonsMatch {
  proficiency?: boolean;
  attacks?: boolean;
  saves?: boolean;
}

interface DDBSummonsBonuses {
  ac?: string;
  hp?: string;
  attackDamage?: string;
  saveDamage?: string;
  healing?: string;
}

interface DDBSummonsData {
  match?: DDBSummonsMatch;
  bonuses?: DDBSummonsBonuses;
  [key: string]: any;
}

// -- Activity Parent Lookup -------------------------------------------------

interface DDBActivityParentLookup extends Partial<DDBActivityData> {
  lookupName: string;
}

// -- Activity Data (main getter) --------------------------------------------

interface DDBActivityData {
  name?: string;
  id?: string;
  type?: string;
  parent?: DDBActivityParentLookup[];

  // Consume targets
  noConsumeTargets?: boolean;
  addItemConsume?: boolean;
  itemConsumeTargetName?: string;
  itemConsumeValue?: string | number;
  addScalingMode?: "" | "amount" | "level";
  addScalingFormula?: string;

  addActivityConsume?: boolean;
  activityConsumeValue?: string | number;
  addActivityScalingMode?: "" | "amount" | "level";
  addActivityScalingFormula?: string;

  addSpellSlotConsume?: boolean;
  removeSpellSlotConsume?: boolean;
  noSpellslot?: boolean;
  spellSlotConsumeTarget?: string;
  spellSlotConsumeValue?: string | number;
  addSpellSlotScalingMode?: "" | "amount" | "level";
  addSpellSlotScalingFormula?: string;

  additionalConsumptionTargets?: DDBConsumptionTarget[];
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
  damageParts?: DDBDamagePart[];
  allowCritical?: boolean;

  // Restrictions
  allowMagical?: boolean;
  noeffect?: boolean;

  // Data merge & function
  data?: Record<string, any> | (() => Record<string, any>);
  func?: (params: { activity: any }) => void | Promise<void>;

  // Summons
  profileKeys?: DDBSummonProfileKey[];
  summons?: DDBSummonsData;

  // Spell parsing flags
  addSingleFreeUse?: boolean;
  addSingleFreeRecoveryPeriod?: string;
  additionalDamageIncludeBase?: boolean;
  stopHealSpellActivity?: boolean;
  splitDamage?: boolean;
  addSpellUuid?: string;
}

// -- Magical Bonus ----------------------------------------------------------

interface DDBMagicalBonus {
  nameAddition?: string | null;
  bonus?: string | number | null;
  mode?: string;
  makeMagical?: boolean;
}

// -- Macro Change Inputs ----------------------------------------------------

interface DDBMacroChange {
  macroValues?: string;
  macroType?: string;
  macroName?: string;
  keyPostfix?: string;
  priority?: number;
  ddbFunctions?: boolean | null;
  functionCall?: string | null;
  functionParams?: string;
}

interface DDBOnUseMacroChange {
  macroPass: string;
  macroType?: string;
  macroName?: string;
  document?: any;
  priority?: number;
  macroParams?: string;
  functionCall?: string | null;
  functionParams?: string;
}

interface DDBDamageBonusMacroChange {
  macroType?: string;
  macroName?: string;
  document?: any;
  priority?: number;
  functionCall?: string | null;
}

interface DDBTargetUpdateMacroChange {
  macroPass?: string;
  macroType?: string;
  macroName?: string;
  document: any;
  priority?: number;
  macroParams?: string;
  functionCall?: string | null;
  functionParams?: string;
}

interface DDBMidiOptionalChange {
  name: string;
  priority?: number;
  data: Record<string, string | number>;
}

interface DDBOptionalMacroChange {
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

interface DDBEffectOptions {
  description?: string;
  durationSeconds?: number;
  durationRounds?: number;
  transfer?: boolean;
  disabled?: boolean;
  [key: string]: any;
}

// -- Aura Effects -----------------------------------------------------------

interface DDBAuraEffects {
  [key: string]: any;
}

// -- Effect Hint ------------------------------------------------------------

interface DDBEffectHint {
  // Creation control
  noCreate?: boolean;
  raw?: Record<string, any>;
  type?: string;

  // Naming & data
  name?: string;
  data?: Record<string, any>;
  options?: DDBEffectOptions;

  // Changes
  changes?: any[] | ((data: any) => any[]);
  changesOverwrite?: boolean;
  atlChanges?: any[];
  tokenMagicChanges?: any[];
  midiChanges?: any[];
  daeChanges?: any[];

  // DAE
  daeStackable?: string;
  daeSpecialDurations?: string[];

  // Status effects
  statuses?: string[];
  riderStatuses?: string[];

  // Activity matching
  activityMatch?: string;
  activitiesMatch?: string[];
  ignoreTransfer?: boolean;

  // MIDI
  midiProperties?: Record<string, any>;
  midiOptionalChanges?: DDBMidiOptionalChange[];
  optionalMacroChanges?: DDBOptionalMacroChange[];
  onUseMacroChanges?: DDBOnUseMacroChange[];
  macroChanges?: DDBMacroChange[];
  targetUpdateMacroChanges?: DDBTargetUpdateMacroChange[];
  damageBonusMacroChanges?: DDBDamageBonusMacroChange[];

  // Auras
  auraeffects?: DDBAuraEffects;

  // Enchant
  magicalBonus?: DDBMagicalBonus;
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

interface DDBOverrideData {
  noTemplate?: boolean;
  removeDamage?: boolean;
  rangeSelf?: boolean;
  replaceActivityUses?: boolean;
  forceSpellAdvancement?: boolean;
  descriptionSuffix?: string;
  ddbMacroDescription?: boolean;
  data?: Record<string, any>;
  func?: (params: { enricher: any }) => void | Promise<void>;
}

// -- Additional Activities --------------------------------------------------

interface DDBActivityAction {
  name: string;
  type: string;
  isAttack?: boolean | null;
  rename?: string[] | null;
  id?: string | null;
}

interface DDBActivityConstructor {
  name: string;
  type: string;
  [key: string]: any;
}

interface DDBActivityBuild {
  generateConsumption?: boolean;
  generateTarget?: boolean;
  generateRange?: boolean;
  generateActivation?: boolean;
  generateDamage?: boolean;
  generateSave?: boolean;
  generateDuration?: boolean;
  generateHealing?: boolean;
  generateUtility?: boolean;
  generateDDBMacro?: boolean;
  noeffect?: boolean;
  noSpellslot?: boolean;
  allowCritical?: boolean;
  onsave?: boolean | string;
  onSave?: string;
  activationOverride?: Record<string, any>;
  durationOverride?: Record<string, any>;
  rangeOverride?: Record<string, any>;
  targetOverride?: Record<string, any>;
  saveOverride?: Record<string, any>;
  damageParts?: DDBDamagePart[];
  img?: string;
  ddbMacroOverride?: {
    name: string;
    function: string;
    visible?: boolean;
    parameters?: string;
  };
  [key: string]: any;
}

interface DDBAdditionalActivity {
  // Pattern 1: Duplicate existing activity
  duplicate?: boolean;

  // Pattern 2: Build from DDB action
  action?: DDBActivityAction;

  // Pattern 3: Build from scratch
  constructor?: DDBActivityConstructor;
  build?: DDBActivityBuild;

  // Common
  id?: string | null;
  overrides?: Partial<DDBActivityData>;
}

// -- Document Stub ----------------------------------------------------------

interface DDBDocumentStub {
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

interface DDBItemMacro {
  type?: string;
  name?: string;
  macroType?: string;
  macroName?: string;
}

// -- Set MIDI On Use Macro Flag ---------------------------------------------

interface DDBSetMidiOnUseMacroFlag {
  type?: string;
  name?: string;
  macroType?: string;
  macroName?: string;
  triggerPoints?: string[];
  functionCall?: string | null;
}

// -- Macro Description Data -------------------------------------------------

interface DDBMacroDescriptionData {
  name: string;
  type: string;
  label?: string;
  parameters?: string;
}
