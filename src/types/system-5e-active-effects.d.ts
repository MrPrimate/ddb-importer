import { STATUSES } from "../config/dictionary/effects/data";

export {};

global {

  type TActiveEffectChangeType = "custom" | "multiply" | "add" | "subtract" | "downgrade" | "upgrade" | "override";
  type TActiveEffectChangePhase = "initial" | "final";
  type TEffectDurationUnit = "years" | "months" | "days" | "hours" | "minutes" | "seconds" | "rounds" | "turns";
  type TEffectDurationExpiry = "combatStart" | "roundStart" | "turnStart" | "combatEnd" | "roundEnd" | "turnEnd";
  type TEffectShowIcon = 0 | 1 | 2; // NEVER | CONDITIONAL | ALWAYS

  interface IActiveEffectChangeData {
    key: string;
    type: TActiveEffectChangeType;
    value: any;
    phase?: TActiveEffectChangePhase;
    priority?: number;
  }

  type DAESpecialDuration =
    // Turn/Combat timing
    | "turnStart"
    | "turnEnd"
    | "turnStartSource"
    | "turnEndSource"
    | "combatEnd"
    // Attack/Action triggers
    | "1Action"
    | "1Attack"
    | "1Attack:mwak"
    | "1Attack:rwak"
    | "1Reaction"
    | "1Save"
    | "1Spell"
    // Condition triggers
    | "isAttacked"
    | "isDamaged"
    | "DamageDealt"
    | "isSave"
    | "isInitiative"
    | "Initiative"
    // Skill check triggers
    | "isSkill.acr"
    | "isSkill.ath"
    | "isSkill.his"
    | "isSkill.ins"
    | "isSkill.inv"
    | "isSkill.itm"
    | "isSkill.per"
    | "isSkill.prf"
    | "isSkill.ste"
    // attacked
    | "1Hit"
    | "1Hit:mwak"
    | "1Hit:rwak"
    | "1Hit:msak"
    | "1Hit:rsak";

  type TEffectType = "base" | "enchant";

  interface I5eEffectSystem {
    changes?: IActiveEffectChangeData[];
  }

  export interface I5eEffectData {
    _id?: string;
    type?: TEffectType;
    origin?: string;
    img?: string;
    name?: string;
    statuses?: typeof STATUSES;
    system?: I5eEffectSystem;
    duration?: IEffectDuration;
    start?: IEffectStartData | null;
    tint?: string;
    transfer?: boolean;
    disabled?: boolean;
    showIcon?: TEffectShowIcon;
    flags?: {
      ActiveAuras?: {
        ignoreSelf?: boolean;
        aura: "Allies" | "Enemy" | "All";
        alignment?: string;
        type?: string;
        height?: boolean;
        hostile?: boolean;
        onlyOnce?: boolean;
        radius?: string;
        isAura?: boolean;
        inactive?: boolean;
        hidden?: boolean;
        displayTemp?: boolean;
        statuses?: string[];
      };
      auraeffects?: IDDBAuraEffects;
      dae?: {
        selfTarget?: boolean;
        selfTargetAlways?: boolean;
        macroRepeat?: "startEndEveryTurn" | "startEveryTurn" | "endEveryTurn" | "startEndTurn" | "startTurn" | "endTurn" | string;
        showIcon?: boolean | null;
        transfer?: boolean;
        stackable?: string;
        specialDuration?: DAESpecialDuration[];
        armorEffect?: boolean;
      };
      ddbimporter?: {
        infusion?: boolean;
        disabled?: boolean;
        characterEffect?: boolean;
        entityTypeId?: string | null;
        itemId?: string | null;
        activityRiders?: string[];
        effectRiders?: string[];
        effectIdLevel?: {
          min?: number | null;
          max?: number | null;
        };
      };
      "midi-qol"?: {
        forceCEOff?: boolean;
      };
      core?: Record<string, unknown>;
      [key: string]: any;
    };
    description?: string;
  }

  interface IEffectModules {
    hasCore: boolean;
    hasMonster: boolean;
    daeInstalled: boolean;
    midiQolInstalled: boolean;
    atlInstalled: boolean;
    atlInstalled: boolean;
    tokenMagicInstalled: boolean;
    activeAurasInstalled: boolean;
    auraeffectsInstalled: boolean;
    autoAnimationsInstalled: boolean;
    chrisInstalled: boolean;
    vision5eInstalled: boolean;
  }

  interface IEffectDuration {
    value?: number | null;
    units?: TEffectDurationUnit;
    expiry?: TEffectDurationExpiry | null;
    expired?: boolean;
  }

  interface IEffectStartData {
    combat?: string | null;
    combatant?: string | null;
    initiative?: number;
    round?: number;
    turn?: number;
    time?: number;
  }

  interface IBaseEffectOptions {
    transfer?: boolean;
    disabled?: boolean;
    description?: string | null;
    durationSeconds?: number | null;
    durationRounds?: number | null;
    durationTurns?: number | null;
    showIcon?: TEffectShowIcon;
  }

  interface IStatusConditionEffectOptions {
    text?: string | null;
    status?: any;
    nameHint?: string | null;
    flags?: any;
  }

  interface IStatusEffectOptions {
    ddbDefinition?: any;
    foundryItem?: any;
    labelOverride?: string;
  }

  interface ISimpleConditionOptions {
    disabled?: boolean;
    transfer?: boolean;
  }

}
