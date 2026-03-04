// ---------------------------------------------------------------------------
// DDB Spell Source Interfaces
// Models the JSON returned by the DDB proxy API for spells.
// Leaf objects that are not yet fully typed use `any`.
// ---------------------------------------------------------------------------

export {};

global {


  // ---- Spells (source-categorized) ------------------------------------------

  export interface IDDBSpellActivation {
    activationTime: number;
    activationType: number;
  }

  export interface IDDBSpellRange {
    origin: string;
    rangeValue: number | null;
    aoeType: string | null;
    aoeValue: number | null;
  }

  export interface IDDBSpellDuration {
    durationInterval: number | null;
    durationUnit: string | null;
    durationType: string;
  }

  export interface IDDBSpellCondition {
    type: number;
    conditionId: number;
    conditionDuration: number;
    durationUnit: string;
    exception: string;
  }

  export interface IDDBHigherLevelDefinition {
    level: number | null;
    typeId: number;
    dice: IDDBDamageDice | null;
    value: number | null;
    details: string;
  }

  export interface IDDBAtHigherLevels {
    higherLevelDefinitions: IDDBHigherLevelDefinition[];
    additionalAttacks: any[];
    additionalTargets: any[];
    areaOfEffect: any[];
    duration: any[];
    creatures: any[];
    special: any[];
    points: any[];
    range: any[];
  }

  export interface IDDBSpellModifier extends IDDBBaseModifier {
    dice: IDDBDamageDice | null;
    die: IDDBDamageDice | null;
    count: number;
    durationUnit: string | null;
    usePrimaryStat: boolean;
    atHigherLevels: IDDBAtHigherLevels;
  }

  export interface IDDBSpellDefinition extends IDDBCommonDefinition {
    definitionKey: string;
    snippet: string;
    level: number;
    school: string;
    ritual: boolean;
    concentration: boolean;
    isHomebrew: boolean;
    isLegacy: boolean;
    // Casting
    activation: IDDBSpellActivation;
    castingTimeDescription: string;
    duration: IDDBSpellDuration;
    range: IDDBSpellRange;
    rangeArea: any | null;
    asPartOfWeaponAttack: boolean;
    canCastAtHigherLevel: boolean;
    // Attack / save
    attackType: number | null;
    requiresAttackRoll: boolean;
    requiresSavingThrow: boolean;
    saveDcAbilityId: number | null;
    // Components
    components: number[];
    componentsDescription: string;
    // Damage / healing
    damageEffect: any | null;
    healing: any | null;
    healingDice: any[];
    tempHpDice: any[];
    // Scaling
    scaleType: string | null;
    atHigherLevels: IDDBAtHigherLevels;
    // Modifiers & conditions
    modifiers: IDDBSpellModifier[];
    conditions: IDDBSpellCondition[];
    // Tags & sources
    tags: string[];
    sources: IDDBSource[];
    spellGroups: any[];
    // Misc
    sourceId: number | null;
    sourcePageNumber: number | null;
    version: string | null;
  }

  export interface IDDBSpellLimitedUse {
    name: string | null;
    statModifierUsesId: number | null;
    resetType: number;
    numberUsed: number;
    minNumberConsumed: number | null;
    maxNumberConsumed: number;
    maxUses: number;
    operator: number;
    useProficiencyBonus: boolean;
    proficiencyBonusOperator: number;
    resetDice: any | null;
  }

  export interface IDDBSpellEntry {
    overrideSaveDc: number | null;
    limitedUse: IDDBSpellLimitedUse | null;
    id: number | null;
    entityTypeId: number | null;
    definition: IDDBSpellDefinition;
    definitionId: number;
    prepared: boolean;
    countsAsKnownSpell: boolean | null;
    usesSpellSlot: boolean;
    castAtLevel: number | null;
    alwaysPrepared: boolean;
    restriction: string | null;
    spellCastingAbilityId: number | null;
    displayAsAttack: boolean | null;
    additionalDescription: string | null;
    castOnlyAsRitual: boolean;
    ritualCastingType: number | null;
    range: IDDBSpellRange;
    activation: IDDBSpellActivation;
    baseLevelAtWill: boolean;
    atWillLimitedUseLevel: number | null;
    isSignatureSpell: boolean | null;
    componentId: number;
    componentTypeId: number;
    spellListId: number | null;
    unPreparedCantrip: boolean | null;
  }

  type IDDBSpells = IDDBSourceCategorized<IDDBSpellEntry[] | null>;


}
