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
  /** Rule categories accepted as the `key` of a `dnd5e.*` rule change. */
  type TRuleChangeCategory = "d20" | "attack" | "check" | "save" | "damage" | "healing";
  /**
   * One clause of a dnd5e 6.0 FiltersField (`conditions`): `k` is a dot path into the check data,
   * `v` the comparison value and `o` the operator, defaulting to `exact`. Comparison operators are
   * lowercase (`in`, `gte`, `has`...); the array combinators (`AND`, `OR`, `NOT`...) are uppercase
   * and take further filters as `v`.
   */
  interface IEffectChangeFilter {
    k?: string;
    v?: unknown;
    o?: string;
  }
  type TEffectDurationUnit = "years" | "months" | "days" | "hours" | "minutes" | "seconds" | "rounds" | "turns";
  /** Core combat-edge expiries. */
  type TEffectDurationExpiry = "turnStart" | "turnEnd" | "roundStart" | "roundEnd" | "combatStart" | "combatEnd";
  /** dnd5e 6.0 durationless expiries - the system forces `duration.value` null for these. */
  type TEffectDurationlessExpiry = "shortRest" | "longRest";
  /** dnd5e 6.0 pseudo expiries - evaluated live against the source/target actor's turn edges. */
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
    /** dnd5e 6.0 FiltersField - JSON string, e.g. `{"k":"roll.attack.type","v":"melee"}`. Keep simple; shape in flux upstream. */
    conditions?: string;
    /** dnd5e 6.0 - resolve roll data references in `value` at transfer time against origin or target. */
    replacement?: "" | "origin" | "target";
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

  type TEffectType = "base" | "condition" | "enchantment";

  interface IDDBStandaloneEffectParent {
    name: string;
    /** Folder type label key, see DDBEffectImporter.PARENT_TYPES (e.g. "spell", "classFeature", "monsterFeature"). */
    type: string;
    bookCode: string | null;
    isLegacy: boolean;
  }

  /** dnd5e 6.0 (#7302) structured origin; the system derives the legacy `origin` string from these at preparation. */
  interface I5eEffectSystemOrigin {
    activity?: string;
    actor?: string;
    behavior?: string;
    effect?: string;
    item?: string;
    /** Transform profile id (DocumentIdField, not a uuid). */
    profile?: string;
  }

  /** `type: "base"` system data (dnd5e 6.0 BaseEffectData). */
  interface I5eEffectSystem {
    changes?: IActiveEffectChangeData[];
    origin?: I5eEffectSystemOrigin;
    /** Effect-level FiltersField JSON - limits when the whole effect applies. */
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
    origin?: I5eEffectSystemOrigin;
    /** Condition level for levelled conditions (Exhaustion); clamped to `CONFIG.DND5E.conditionTypes[type].levels`. */
    level?: number | null;
    /** The primary status id, e.g. "exhaustion". */
    type?: string;
  }

  /** `type: "enchantment"` system data (dnd5e 6.0 EnchantmentData). */
  interface I5eEnchantmentEffectSystem {
    changes?: IActiveEffectChangeData[];
    origin?: I5eEffectSystemOrigin;
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
        /** Set on standalone (compendium) effects: the document that declared the effect, used for compendium folders. */
        parent?: IDDBStandaloneEffectParent;
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
        /** Legacy enchantment marker - 6.0 migrates it to `type: "enchantment"`; prefer setting the document `type` directly. */
        type?: string;
        /** Legacy rider statuses - 6.0 migrates to `system.rider.statuses`; prefer the system path. */
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
    tokenMagicInstalled: boolean;
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
