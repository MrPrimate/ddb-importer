import { STATUSES } from "../config/dictionary/effects/data";

export {};

global {

  interface IActiveEffectChangeData {
    key: string;
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM | CONST.ACTIVE_EFFECT_MODES.ADD | CONST.ACTIVE_EFFECT_MODES.MULTIPLY | CONST.ACTIVE_EFFECT_MODES.OVERRIDE | CONST.ACTIVE_EFFECT_MODES.DOWNGRADE | CONST.ACTIVE_EFFECT_MODES.UPGRADE;
    value: any;
    priority: number;
  }

  type DAESpecialDuration =
    // Turn/Combat timing
    | "turnStart"
    | "turnEnd"
    | "turnStartSource"
    | "turnEndSource"
    | "combatEnd"
    // Rest timing
    | "shortRest"
    | "longRest"
    | "newDay"
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

  // v14 branch splits native expiry from DAE-only tokens; here every token is DAE-only
  type TDAEOnlySpecialDuration = DAESpecialDuration;
  type TDAESpecialDuration = DAESpecialDuration;

  // Foundry v14 effect duration units, kept only as the intermediate form the shared parser
  // emits before durations are written back as seconds/rounds on this branch
  type TEffectDurationUnit = "years" | "months" | "days" | "hours" | "minutes" | "seconds" | "rounds" | "turns";

  // v14 branch registers a dedicated AC5e change type; here an AC5e change is a plain change
  type IAC5eActiveEffectChangeData = IActiveEffectChangeData;

  // native effect expiry points of the v14 branch, translated to DAE tokens on this branch
  type T5eEffectExpiry = TDDBEffectExpiry;

  type TEffectType = "base" | "enchant";

  export interface I5eEffectData {
    _id?: string;
    type?: TEffectType;
    origin?: string;
    img?: string;
    name?: string;
    statuses?: typeof STATUSES;
    changes?: IActiveEffectChangeData[];
    duration?: IEffectDuration;
    tint?: string;
    transfer?: boolean;
    disabled?: boolean;
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
        itemRiders?: string[];
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
    // [key: string]: any;
  }

  interface IEffectModules {
    hasCore: boolean;
    hasMonster: boolean;
    daeInstalled: boolean;
    midiQolInstalled: boolean;
    atlInstalled: boolean;
    timesUpInstalled: boolean;
    tokenMagicInstalled: boolean;
    ac5eInstalled: boolean;
    activeAurasInstalled: boolean;
    auraeffectsInstalled: boolean;
    autoAnimationsInstalled: boolean;
    chrisInstalled: boolean;
    vision5eInstalled: boolean;
  }

  interface IEffectDuration {
    seconds?: number | null;
    startTime?: number | null;
    rounds?: number | null;
    turns?: number | null;
    startRound?: number | null;
    startTurn?: number | null;
  }

  interface IBaseEffectOptions {
    transfer?: boolean;
    disabled?: boolean;
    description?: string | null;
    durationSeconds?: number | null;
    durationRounds?: number | null;
    durationTurns?: number | null;
    showIcon?: boolean | null;
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
