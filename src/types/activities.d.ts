import { IDDBDamagePart } from "../parser/enrichers/data/types";

export {};

global {
  export interface IActivitySaveData {
    ability: string[];
    dc: {
      calculation: string;
      formula: string;
    };
    override?: boolean;
  }

  export interface IActivityCheckData {
    ability: string[];
    associated: string[];
    dc: {
      calculation: string;
      formula: string;
    };
  }

  export interface IActivityEffectData {
    _id: string;
    onSave?: boolean;
  }

  export interface IActivityVisibilityData {
    level?: {
      min?: number | null;
      max?: number | null;
    };
    requireAttunement?: boolean;
    requireIdentification?: boolean;
    requireMagic?: boolean;
    identifier?: string;
  }

  export interface IActivitySpellData {
    challenge?: {
        override: boolean;
    };
    properties?: ("vocal" | "somatic" | "material" | "concentration" | "ritual")[];
    spellbook?: boolean;
    uuid?: string;
    ability?: string;
  }

  export interface IActivityRestrictionsData {
    allowMagical?: boolean;
    categories?: string[];
    properties?: string[];
    type?: string;
  }

  export interface IActivitySettingsData {
    effects?: string[];
    keep?: string[];
    tempFormula?: string;
    preset?: string;
    merge?: string[];
    other?: string[];
    spellLists?: string[];
    transformTokens?: boolean;
    minimumAC?: string;
  }

  export interface IActivityData {
    name?: string;
    uses?: I5eSystemLimitedUses;
    sort?: number;
    visibility?: IActivityVisibilityData;
    spell?: IActivitySpellData;
    restrictions?: IActivityRestrictionsData;
    settings?: IActivitySettingsData;
    consumption?: {
      scaling?: {
        allowed?: boolean;
        max?: string;
      };
      spellSlot?: boolean;
      targets?: {
        type?: string;
        target?: string;
        value?: string;
        scaling?: {
          mode?: string;
          formula?: string;
        };
      }[];
    };
    effects?: IActivityEffectData[];
    attack?: {
      ability?: string;
      bonus?: string;
      critical?: {
        threshold?: number;
      };
      flat?: boolean;
      type?: {
        value?: string;
        classification?: string;
      };
    };
    damage?: {
      critical?: {
        allow?: boolean;
        bonus?: string;
      };
      parts?: Partial<IDDBDamagePart>[];
      // midi stuff
      onSave?: string;
    };
    range?: {
      units?: string;
      reach?: number;
      value?: number;
      long?: number;
    };
    healing?: Partial<IDDBDamagePart>;
    overTimeProperties?: {
      turnChoice?: string;
      saveRemoves?: boolean;
      rollAs?: string;
      preRemoveConditionText?: string;
      postRemoveConditionText?: string;
      removeConditionBeforeActivity?: boolean;
      removeConditionText?: string;
    };
    // Consumption and scaling methods/properties
    canScale?: boolean;
    roll?: {
      formula?: string;
    };
    duration?: {
      concentration?: boolean;
      override?: boolean;
      special?: string;
      units?: string;
      value?: string;
    };
    target?: {
      template?: {
        count?: string;
        contiguous?: boolean;
        type?: string;
        size?: string;
        width?: string;
        height?: string;
        units?: string;
      };
      affects?: {
        count?: string;
        type?: string;
        choice?: boolean;
        special?: string;
      };
    };
    activation?: {
      type?: string;
      value?: string;
      condition?: string;
      cost?: number;
    };
    save?: IActivitySaveData;
    check?: IActivityCheckData;
    actionType?: string;
    uuid?: string;
    otherActivity?: IActivity | null;
    type?: string;
    useCondition?: string;
    effectCondition?: string;
    midiProperties?: {
      ignoreTraits?: string[];
      triggeredActivityId?: string;
      triggeredActivityConditionText?: string;
      triggeredActivityTargets?: string;
      triggeredActivityRollAs?: string;
      autoConsume?: boolean;
      forceConsumeDialog?: string;
      forceRollDialog?: string;
      forceDamageDialog?: string;
      confirmTargets?: string;
      autoTargetType?: string;
      autoTargetAction?: string;
      automationOnly?: boolean;
      otherActivityCompatible?: boolean;
      identifier?: string;
      displayActivityName?: boolean;
      rollMode?: keyof CONFIG.Dice.RollModes;
      chooseEffects?: boolean;
      toggleEffect?: boolean;
      ignoreFullCover?: boolean;
      removeChatButtons?: string;
      magicEffect?: boolean;
      magicDamage?: boolean;
      noConcentrationCheck?: boolean;
      skipConcentrationCheck?: boolean;
      autoCEEffects?: string;
    };
    flags?: {
      ddbimporter?: {
        isElixirAdditionalActivity?: boolean;
      };
    };
  }
}

