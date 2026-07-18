export {};

global {
  interface IDDBDamageAdjustment {
    id: number;
    type: number;
    kind: TDDBDamageConditionType;
    name: string;
    foundryValues?: I5eDamageTraitSet;
    foundryValue?: string;
    value?: string;
    values?: string;
    midiValues?: string[];
  }

  interface IDDBSkillsLookup {
    name: T5eSkillKey;
    label: string;
    ability: T5eAbility;
    subType: string;
    valueId: number;
  }

  interface DDBAbilityLookup {
    id: number;
    value: T5eAbility;
    long: T5eAbilityLongNames;
  }

  interface IDDBClassSkillDictionary {
    name: string;
    multiclassSkill: 0 | 1;
    multiclassTool: 0 | 1;
  }

  type TDDBBClassSkillVersionDictionary = Record<T5eRulesVersion, IDDBClassSkillDictionary[]>;

  interface IDDBActorSizeData {
    name: string;
    value: TActorSizes;
    size: number;
    id: number;
    scale: number;
  }

}
