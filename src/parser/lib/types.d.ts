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

}
