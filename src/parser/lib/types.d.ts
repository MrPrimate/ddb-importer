export {};

global {

  type TDDBLimitedUses = IDDBActionLimitedUse | IDDBInventoryLimitedUse | IDDBClassFeatureLimitedUse | IDDBSpellLimitedUse;

  interface IParseStatusConditionResult {
    success: boolean;
    check: boolean;
    save: I5eActivitySave;
    condition: string | null;
    group4: boolean | null;
    group4Condition: IDDBConfigDamageAdjustment | null;
    conditionName: string | null;
    duration: IEffectDuration;
    specialDurations: string[];
    match: RegExpExecArray | null;
    riderStatuses: string[];
  }


  // shape produced by DDBDescriptions.parseOutMonsterSpells
  interface IDDBParsedMonsterSpell {
    name: string;
    level: string | null;
    extra: string | null;
    targetSelf: boolean | null;
    duration: { override: boolean; value: string; units: string } | null;
    // present on innate "N/period each:" style lists
    period?: string;
    quantity?: string;
  }

  interface IFeatureBasicsSave {
    ability: string[];
    dc: {
      calculation: string;
      formula: string;
    };
    half: boolean;
  }

  interface IFeatureBasicsResult {
    matches: {
      attackMatches: RegExpExecArray | null;
      summonAttackMatches: RegExpExecArray | null;
      healingMatch: boolean;
      spellSave: RegExpMatchArray | null;
      saveSearchMatch: RegExpMatchArray | null;
      saveSearchNewMatch: RegExpMatchArray | null;
      halfMatch: boolean;
    };
    save: IFeatureBasicsSave;
    midiProperties: { otherSaveDamage: string } | { saveDamage: string };
    properties: {
      isAttack: boolean;
      isSummonAttack: boolean;
      spellSaveRegExpMatchArray: RegExpMatchArray | null;
      isSpellSave: boolean;
      savingThrowRegExpMatchArray: RegExpMatchArray | null;
      isSavingThrow: boolean;
      summonSaveRegExpMatchArray: RegExpMatchArray | null;
      isSummonSave: boolean;
      isSave: boolean;
      halfDamage: boolean;
      pbToAttack: boolean;
      weaponAttack: boolean;
      spellAttack: boolean;
      meleeAttack: boolean;
      rangedAttack: boolean;
      healingAction: boolean;
      toHit: number;
      yourSpellAttackModToHit: boolean;
    };
  }

  interface IDCParserResult {
    save: I5eActivitySave;
    match: RegExpExecArray | null;
    damageAndSave: boolean;
    check?: boolean;
    duration: {
      type: string | null;
      value: string | null;
      units?: string;
    };
    damage: {
      type: string | null;
      value: string | null;
    };
    riderStatuses: string[];
  }

  interface IModFilterOptions {
    classFeatureIds?: number[] | null;
    classId?: number | null;
    requiredLevel?: number | null;
    exactLevel?: number | null;
  }

  interface IDDBModifiersBaseOptions {
    includeExcludedEffects?: boolean;
    effectOnly?: boolean;
    classId?: number | null;
    availableToMulticlass?: boolean | null;
    useUnfilteredModifiers?: boolean | null;
  }

  interface IDDBModifiersChosenBaseModifiersOptions extends IDDBModifiersBaseOptions {
    requiredLevel?: number | null;
    exactLevel?: number | null;
    filterOnFeatureIds?: number[];
  }

  interface IDDBModifiersChosenTypeModifiersOptions extends IDDBModifiersChosenBaseModifiersOptions {
    type?: ICoreSourceTypes;
  }

  interface IDDBModifiersFilterBaseModifiersOptions extends IDDBModifiersBaseOptions {
    subType?: string | null;
    restriction?: (string | null)[];
  }


  interface IDDBRuleLink {
    reference?: {
      label: string;
      reference?: string;
    } | string;
    label?: string;
    id?: number;
  }

  interface IDDBRuleLinksLookup {
    [key: string]: Record<string, IDDBRuleLink>;
    senses: Record<string, IDDBRuleLink>;
    actions: Record<string, IDDBRuleLink>;
    weaponproperties: Record<string, IDDBRuleLink>;
  }
}
