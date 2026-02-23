// Temporary, so that I can at least type them to _something_
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ActivitySave = {
  ability: Set<string>;
  dc: {
    calculation: string;
    formula: string;
    value: number
  };
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ActivityCheck = {
  ability: string;
  associated: Set<string>;
  dc: {
    calculation: string;
    formula: string;
    value: number
  };
}

export interface ActivityEffectData {
  _id: string;
  get effect(): ActiveEffect.Implementation | undefined;
  onSave?: boolean;
}


export interface Activity extends AnyMutableObject {
  get applicableEffects(): ActiveEffect[] | null;
  actor?: Actor.Implementation;
  item: Item.Implementation;
  ammunitionItem?: Item.Implementation;
  name: string;
  uses: {
    spent: number;
    max: number;
    get value(): number;
    recovery: unknown[];
  }
  consumption: {
    scaling: {
      allowed: boolean;
      max: string;
    };
    spellSlot: boolean;
    targets: {
      type: string;
      target: string;
      value: string;
      scaling: {
        mode: string;
        formula: string;
      }
    }[];
  };
  effects: ActivityEffectData[];
  attack?: {
    ability: string;
    bonus: string;
    critical: {
      threshold: number;
    };
    flat: boolean;
    type: {
      value: string;
      classification: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    damage: {};
  };
  damage?: {
    critical: {
      allow: boolean;
      bonus: string;
    };
    parts: {
      number: number;
      denomination: number;
      bonus: string;
      types: Set<string>;
      custom: {
        enabled: boolean;
        formula: string;
      };
      scaling: {
        mode: string;
        number: number;
        formula: string;
      };
    }[];
    // midi stuff
    onSave: string;
  };
  range?: {
    units?: string;
    reach?: number;
    value?: number;
    long?: number;
  }
  healing?: {
    number: number;
    denomination: number;
    bonus: string;
    types: Set<string>;
    custom: {
      enabled: boolean;
      formula: string;
    };
    scaling: {
      mode: string;
      number: number;
      formula: string;
    };
  };
  overTimeProperties?: {
    turnChoice?: string;
    saveRemoves?: boolean;
    rollAs?: string;
    preRemoveConditionText?: string;
    postRemoveConditionText?: string;
    removeConditionBeforeActivity?: boolean;
    removeConditionText?: string;
  }
  metadata: {
    title: string;
    img: string;
    label: string;
    name: string;
    type: string;
    usage: {
      actions: unknown;
      chatCard: string;
      dialog: unknown;
    };
  };
  refund: (consumed: unknown) => Promise<void>;
  getRollData: () => AnyMutableObject;
  rollAttack?(config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig): Promise<Roll[] | null>;
  rollDamage(config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig): Promise<Roll[] | void>;
  rollFormula?(config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig): Promise<Roll[] | void>;
  // Consumption and scaling methods/properties
  canScale?: boolean;
  _prepareUsageConfig: (config: object) => object;
  _prepareUsageUpdates: (config: object, options?: { returnErrors?: boolean }) => Promise<any>;
  // consume() method for consuming activity resources - returns consumed delta data or false if cancelled
  consume: (usageConfig: object, messageConfig: object) => Promise<object | false>;
  roll?: {
    formula?: string;
  };
  duration: {
    concentration?: boolean;
    override?: boolean;
    scalar?: boolean;
    special: string;
    units: string;
    value: number;
  }
  target: {
    template: {
      count: string;
      contiguous: boolean;
      type: string;
      size: string;
      width: string;
      height: string;
      units: string;
    };
    affects: {
      count: string;
      type: string;
      choice: boolean;
      special: string;
    }
  };
  activation: {
    type: string;
    value: number;
    condition: string;
    cost?: number;
  };
  save?: ActivitySave;
  check?: ActivityCheck;
  getAbility?: (associated: string) => string | null;
  hasDamage: boolean;
  hasHealing: boolean;
  actionType: string;
  uuid: string;
  otherActivity?: Activity | null;
  type: string;
  useCondition: string;
  effectCondition: string;
  setupCanSeeSense: (usage: { workflow?: Workflow }) => Promise<void>;
  getTriggeredActivity: () => Promise<Activity | undefined>;
  macro: Macro.Implementation;
  midiProperties?: {
    ignoreTraits: Set<string>;
    triggeredActivityId: string;
    triggeredActivityConditionText?: string;
    triggeredActivityTargets: string;
    triggeredActivityRollAs?: string;
    autoConsume: boolean;
    forceConsumeDialog?: string;
    forceRollDialog?: string;
    forceDamageDialog?: string;
    confirmTargets: string;
    autoTargetType: string;
    autoTargetAction?: string;
    automationOnly?: boolean;
    otherActivityCompatible?: boolean;
    identifier?: string;
    displayActivityName?: boolean;
    rollMode: keyof CONFIG.Dice.RollModes;
    chooseEffects?: boolean;
    toggleEffect?: boolean;
    ignoreFullCover?: boolean;
    removeChatButtons: string;
    magicEffect?: boolean;
    magicDamage?: boolean;
    noConcentrationCheck?: boolean;
    skipConcentrationCheck?: boolean;
    autoCEEffects: string;
  }
  // Midi mixin methods
  hasConsumption: () => boolean;
  shouldAutoConsume: (workflow?: Workflow) => boolean;
  deferOtherDamage: (config: RollProcessConfig, dialog: RollDialogConfig) => boolean;
  rollOtherDamage: (config: RollProcessConfig, dialog: RollDialogConfig) => Promise<Roll[] | undefined>;
}


