export {};

global {

  type TDDBLimitedUses = IDDBActionLimitedUse | IDDBInventoryLimitedUse | IDDBClassFeatureLimitedUse | IDDBSpellLimitedUse;

  // dcParser always populates a full save shape; runtime uses null for "unset"
  // ability in parseStatusCondition, which I5eActivitySave does not allow.
  interface IDCParserSave {
    dc: {
      formula: string;
      calculation: string;
    };
    ability: string[];
  }

  interface IParseStatusConditionResult {
    success: boolean;
    check: boolean;
    save: Omit<I5eActivitySave, "ability"> & { ability: string[] | null };
    condition: string | null;
    group4: boolean | null;
    group4Condition: IDDBDamageAdjustment | null;
    conditionName: string | null;
    duration: {
      value: number | null;
      units: TEffectDurationUnit | null;
    };
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
    save: IDCParserSave;
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
    // null disables restriction filtering entirely (see DDBModifiers.filterModifiers)
    restriction?: (string | null)[] | null;
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
