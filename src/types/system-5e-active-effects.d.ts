import { STATUSES } from "../config/dictionary/effects/data";
import { DAE_EFFECT_EXPIRY_TYPES, DAE_SPECIAL_DURATIONS } from "../parser/enrichers/effects/EffectGenerator";

export {};

global {

  /**
   * Foundry v14 core change types plus the dnd5e 6.0 "rule" change types.
   * For rule types (`dnd5e.*`) the change `key` is a rule category, not a data path:
   * `d20`, `attack`, `check`, `save`, `damage`, `healing`.
   */
  type TActiveEffectChangeType = "custom" | "multiply" | "add" | "subtract" | "downgrade" | "upgrade" | "override"
    | "dnd5e.bonus" | "dnd5e.advantage" | "dnd5e.minimum" | "dnd5e.maximum"
    | "ac5e";
  type TActiveEffectChangePhase = "initial" | "final";
  type TEffectDurationUnit = "years" | "months" | "days" | "hours" | "minutes" | "seconds" | "rounds" | "turns";
  /** Core combat-edge expiries. */
  type TEffectDurationExpiry = "turnStart" | "turnEnd" | "roundStart" | "roundEnd" | "combatStart" | "combatEnd";
  /** dnd5e 6.0 durationless expiries — the system forces `duration.value` null for these. */
  type TEffectDurationlessExpiry = "shortRest" | "longRest";
  /** dnd5e 6.0 pseudo expiries — evaluated live against the source/target actor's turn edges. */
  type TEffectPseudoExpiry = "sourceStart" | "sourceEnd" | "targetStart" | "targetEnd";
  /** Everything accepted in `duration.expiry` under dnd5e 6.0. */
  type T5eEffectExpiry = TEffectDurationExpiry | TEffectDurationlessExpiry | TEffectPseudoExpiry;
  type TDAEEffectExpiryTypes = typeof DAE_EFFECT_EXPIRY_TYPES[number];
  type TEffectShowIcon = 0 | 1 | 2; // NEVER | CONDITIONAL | ALWAYS

  interface IActiveEffectChangeData {
    _id?: string;
    key: string;
    type: TActiveEffectChangeType;
    value: string | number | null;
    phase?: TActiveEffectChangePhase;
    priority?: number;
    /** dnd5e 6.0 FiltersField — JSON string, e.g. `{"k":"roll.attack.type","v":"melee"}`. Keep simple; shape in flux upstream. */
    conditions?: string;
    /** dnd5e 6.0 — resolve roll data references in `value` at transfer time against origin or target. */
    replacement?: "" | "origin" | "target";
  }

  /** An AC5E change. Only `ChangeHelper.ac5eChange` produces one. */
  interface IAC5eActiveEffectChangeData extends IActiveEffectChangeData {
    type: "ac5e";
  }

  type TDAESpecialDuration =
    // for pre v6 only
    | TDAEEffectExpiryTypes
    // Turn/Combat timing
    | typeof DAE_SPECIAL_DURATIONS[number];

  type TEffectType = "base" | "condition" | "enchantment";

  /** `type: "base"` system data (dnd5e 6.0 BaseEffectData). */
  interface I5eEffectSystem {
    changes?: IActiveEffectChangeData[];
    /** Effect-level FiltersField JSON — limits when the whole effect applies. */
    conditions?: string;
    /** Suppressed under antimagic; migration sets true for effects from spells/scrolls/mgc items. */
    magical?: boolean;
    /** Extra statuses applied alongside this effect. Replaces `flags.dnd5e.riders.statuses` (migrated). */
    rider?: {
      statuses?: string[];
    };
  }

  /** `type: "condition"` system data (dnd5e 6.0 ConditionData). Changes here use the plain core schema (no _id/conditions/replacement). */
  interface I5eConditionEffectSystem {
    changes?: IActiveEffectChangeData[];
    /** Condition level for levelled conditions (Exhaustion); clamped to `CONFIG.DND5E.conditionTypes[type].levels`. */
    level?: number | null;
    /** The primary status id, e.g. "exhaustion". */
    type?: string;
  }

  /** `type: "enchantment"` system data (dnd5e 6.0 EnchantmentData). */
  interface I5eEnchantmentEffectSystem {
    changes?: IActiveEffectChangeData[];
    conditions?: string;
    /** Defaults to true for enchantments. */
    magical?: boolean;
  }

  type T5eEffectSystem = I5eEffectSystem | I5eConditionEffectSystem | I5eEnchantmentEffectSystem;

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
      dnd5e?: {
        /** Legacy enchantment marker — 6.0 migrates it to `type: "enchantment"`; prefer setting the document `type` directly. */
        type?: string;
        /** Legacy rider statuses — 6.0 migrates to `system.rider.statuses`; prefer the system path. */
        riders?: {
          statuses?: string[];
        };
        [key: string]: any;
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
    /** Leave null (with a duration-supporting expiry) to inherit the activity's duration on application. */
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
