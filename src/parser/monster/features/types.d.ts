export {};

global {

  interface IDDBMonsterActionDataDamagePart {
    profBonus: string;
    levelBonus: boolean;
    versatile: boolean;
    other: boolean;
    part: I5eDamagePart;
    includesDice: boolean;
    noBonus: boolean;
    damageHasMod: boolean;
  }

  interface IDDBMonsterActionDataHealingPart {
    versatile: boolean;
    part: I5eDamagePart;
  }

  interface IDDBMonsterActionData {
    baseWeapon: baseWeapon | string | null;
    baseTool: string | null;
    damage: I5eDamageBase;
    damageParts: IDDBMonsterActionDataDamagePart[];
    healingParts: IDDBMonsterActionDataHealingPart[];
    versatileParts: I5eDamagePart[];
    saveParts: I5eDamagePart[];
    formula: string;
    target: I5eActivityTarget;
    duration: I5eSystemDurationData;
    extraAttackBonus: number;
    baseAbility: string | null;
    proficient: boolean;
    properties: Partial<Record<TWeaponProperties | TFeatProperties, boolean>>;
    range: I5eWeaponRange;
    activation: I5eActivityActivation;
    save: I5eActivitySave;
    uses: I5eSystemLimitedUses;
    consumptionValue: string | number | null;
    consumptionTargets: I5eConsumptionTarget[];
    weaponType?: TWeaponType;
  }
}
