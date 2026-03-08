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
    damageString: string;
    damageTypes: I5eDamageType[];
  }

  interface IDDBMonsterActionDataHealingPart {
    versatile: boolean;
    part: I5eDamagePart;
  }

  interface IMonsterSpellcastingSpell {
    name: string;
    level?: string | null;
    extra?: string | null;
    period?: string;
    quantity?: string;
    consumeType?: "activityUses" | "itemUses";
    targetSelf?: boolean | null;
    noComponents?: boolean;
    noConcentration?: boolean;
    ability?: string;
    duration?: {
      override: boolean;
      value: string;
      units: string;
    };
  }

  interface IMonsterSpellcastingData {
    dc: number | null;
    ability: string | null;
    material: boolean;
    innateMatch: boolean;
    concentration: boolean;
    innate: boolean;
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
