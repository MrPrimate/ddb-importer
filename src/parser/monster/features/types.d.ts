export {};

global {

  /** A numeric damage token and its position in the original hit text. */
  interface IMonsterDamageToken {
    index: number;
    0: string;
    groups: Record<string, string>;
  }

  interface IMonsterDamageMode {
    name: string;
    condition: string;
    operation: "add" | "replace";
    parts: number[];
    start: number;
    end: number;
    text: string;
  }

  interface IMonsterDamageModeResult {
    normal: number[];
    modes: IMonsterDamageMode[];
    /** The versatile two-handed attack's token indices when the hit has modes too, else empty. */
    versatile: number[];
    warnings: string[];
    normalText: string;
  }

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

  /** A healing option of a multi-option feature (see DDBMonsterFeature.#healOption). */
  interface IMonsterHealOption {
    heal: ISectionSlice;
    /** The feature's one save option, when it has only one. */
    loneSave: ISectionSlice | null;
    /** The text before the first option, which names who the feature targets. */
    intro: string;
  }

  interface IMonsterSpellcastingSpell {
    name: string;
    level?: string | null;
    extra?: string | null;
    period?: string;
    quantity?: string;
    consumeType?: "activityUses" | "itemUses";
    targetSelf?: boolean | null;
    // components this cast's own wording waives, on top of the feature-wide exemption
    ignoredComponents?: TSpellProperties[];
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
    ignoredComponents: TSpellProperties[];
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
    baseAbility: T5eAbility | null;
    proficient: boolean;
    properties: Partial<Record<TWeaponProperties | TFeatProperties, boolean>>;
    range: I5eWeaponRange;
    activation: I5eActivityActivation;
    save: I5eActivitySave;
    uses: I5eSystemLimitedUses;
    consumptionValue: string | number | null;
    consumptionTargets: I5eConsumptionTarget[];
    weaponType?: TWeaponType;
    associatedToolsOrAbilities?: string[];
    ability?: string;
  }
}
