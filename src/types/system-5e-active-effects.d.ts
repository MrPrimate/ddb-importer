import { STATUSES } from "../config/dictionary/effects/data";
import { DAE_SPECIAL_DURATIONS } from "../parser/enrichers/effects/EffectGenerator";

export {};

global {

  /** Foundry v14 core change types. dnd5e 5.3 has no rule (`dnd5e.*`) change types. */
  type TActiveEffectChangeType = "custom" | "multiply" | "add" | "subtract" | "downgrade" | "upgrade" | "override" | "ac5e";
  type TActiveEffectChangePhase = "initial" | "final";
  type TEffectDurationUnit = "years" | "months" | "days" | "hours" | "minutes" | "seconds" | "rounds" | "turns";
  /** Core combat-edge expiries. */
  type TEffectDurationExpiry = "turnStart" | "turnEnd" | "roundStart" | "roundEnd" | "combatStart" | "combatEnd";
  /**
   * Rest expiries. dnd5e 5.3 fires no rest expiry event, so these are written as DAE special-duration
   * tokens rather than onto `duration.expiry`.
   */
  type TEffectDurationlessExpiry = "shortRest" | "longRest";
  /**
   * Source/target turn-edge expiries. dnd5e 5.3 does not provide them; DAE registers them as expiry events
   * on dnd5e < 6.0, and without DAE they fall back to the core turn edges.
   */
  type TEffectPseudoExpiry = "sourceStart" | "sourceEnd" | "targetStart" | "targetEnd";
  /** Every expiry an enricher hint may declare; see EffectExpiryHelpers for how each is written. */
  type T5eEffectExpiry = TEffectDurationExpiry | TEffectDurationlessExpiry | TEffectPseudoExpiry;
  type TDAEEffectExpiryTypes = T5eEffectExpiry;
  type TEffectShowIcon = 0 | 1 | 2; // NEVER | CONDITIONAL | ALWAYS

  interface IActiveEffectChangeData {
    _id?: string;
    key: string;
    type: TActiveEffectChangeType;
    value: string | number | null;
    phase?: TActiveEffectChangePhase;
    priority?: number;
  }

  /** An AC5E change. Only `ChangeHelper.ac5eChange` produces one. */
  interface IAC5eActiveEffectChangeData extends IActiveEffectChangeData {
    type: "ac5e";
  }

  /**
   * Tokens only DAE can express - usage counts and triggers. This is the ONLY
   * union enricher hints may use: turn-edge tokens are natively covered by
   * `duration.expiry` and are banned from `flags.dae.specialDuration`.
   */
  type TDAEOnlySpecialDuration = typeof DAE_SPECIAL_DURATIONS[number];

  type TDAESpecialDuration =
    // for pre v6 data only (legacy flags read back from old imports)
    | TDAEEffectExpiryTypes
    | "turnStartSource"
    | "turnEndSource"
    // Turn/Combat timing
    | TDAEOnlySpecialDuration;

  type TEffectType = "base" | "enchantment";

  interface I5eEffectSystem {
    changes?: IActiveEffectChangeData[];
  }

  type T5eEffectSystem = I5eEffectSystem;

  export interface I5eEffectData {
    _id?: string;
    type?: TEffectType;
    origin?: string;
    img?: string;
    name?: string;
    statuses?: typeof STATUSES;
    system?: T5eEffectSystem;
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
        save?: string;
        savedc?: number | null;
      };
      auraeffects?: IDDBAuraEffects;
      dae?: {
        selfTarget?: boolean;
        selfTargetAlways?: boolean;
        macroRepeat?: "startEndEveryTurn" | "startEveryTurn" | "endEveryTurn" | "startEndTurn" | "startTurn" | "endTurn" | string;
        transfer?: boolean;
        stackable?: string;
        specialDuration?: TDAESpecialDuration[];
        armorEffect?: boolean;
      };
      ddbimporter?: {
        /** Native aura stacking identity; bestFormula uses the originating actor's roll data. */
        aura?: {
          bestFormula: string;
          overrideName: string;
        };
        infusion?: boolean;
        disabled?: boolean;
        characterEffect?: boolean;
        entityTypeId?: string | null;
        itemId?: string | null;
        effectOnSave?: boolean;
        activityRiders?: string[];
        effectRiders?: string[];
        itemRiders?: string[];
        effectIdLevel?: {
          min?: number | null;
          max?: number | null;
        };
      };
      dnd5e?: {
        type?: string;
        riders?: {
          statuses?: string[];
        };
        // [key: string]: any;
        spellLevel?: number;
        /** Profile id of the enchant activity profile that applied this enchantment. */
        enchantmentProfile?: string;
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
    tokenMagicInstalled: boolean;
    activeAurasInstalled: boolean;
    auraeffectsInstalled: boolean;
    autoAnimationsInstalled: boolean;
    chrisInstalled: boolean;
    vision5eInstalled: boolean;
    ac5eInstalled: boolean;
  }

  interface IEffectDuration {
    value?: number | null;
    units?: TEffectDurationUnit | null;
    expiry?: T5eEffectExpiry | null;
    expired?: boolean | null;
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
