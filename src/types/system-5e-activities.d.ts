import { DICTIONARY } from "../config/_module";

export {};

global {

  // ---- Activities -----------------------------------------------------------

  interface I5eActivityActivation {
    type?: TActivationCost;
    value?: number | null;
    condition?: string;
    override?: boolean;
  }

  interface I5eActivityConsumption {
    targets?: I5eConsumptionTarget[];
    scaling?: { allowed?: boolean; max?: string };
    spellSlot?: boolean;
  }

  interface I5eActivityTarget extends I5eSystemTargetData {
    override?: boolean;
  }


  interface I5eActivityRange extends I5eSystemBaseRangeData{
    long?: number | null;
    reach?: string | null;
    override?: boolean;
  }

  interface I5eActivityDuration extends I5eSystemDurationData {
    override?: boolean;
  }

  interface I5eActivityEffect {
    _id?: string;
    /** dnd5e 6.0 - link a standalone/compendium ActiveEffect. Resolution is async (`entry.getEffect()`). */
    uuid?: string;
    onSave?: boolean;
    riders?: {
      activity?: string[];
      effect?: string[];
      item?: string[];
    };
    level?: {
      min?: number | null;
      max?: number | null;
    };
  }

  // ---- Activity behaviors (dnd5e 6.0, attached to template-created Regions) ----

  /** Config for `type: "applyActiveEffect"` - dispositions are derived from the activity target at placement. */
  interface I5eActivityBehaviorApplyEffectConfig {
    /** ActiveEffect UUIDs; ddb-importer enrichers may give standalone effect NAMES, resolved at import. */
    effects?: string[];
    sizes?: TActorSizes[];
    types?: TCreatureTypes[];
  }

  /** Config for `type: "difficultTerrain"`. */
  interface I5eActivityBehaviorDifficultTerrainConfig {
    types?: string[];
  }

  interface I5eActivityBehavior {
    _id?: string;
    type: "applyActiveEffect" | "difficultTerrain" | "ddbMacro";
    name?: string;
    ddbimporter?: {
      auraeffectsOnly?: boolean;
      auraeffectsNever?: boolean;
      ac5eOnly?: boolean;
      ac5eNever?: boolean;
    };
    level?: {
      min?: number | null;
      max?: number | null;
    };
    config?: I5eActivityBehaviorApplyEffectConfig | I5eActivityBehaviorDifficultTerrainConfig | I5eActivityBehaviorMacroConfig;
  }

  /** ddb-importer's `ddbMacro` activity behavior: run a RegionAutomations handler on core region events. */
  interface I5eActivityBehaviorMacroConfig {
    function?: string;
    events?: string[];
    /** Sibling activity id to use instead of the placing activity. */
    activity?: string;
    oncePerTurn?: boolean;
    /** Never trigger for the token the region originates from. */
    excludeSelf?: boolean;
    scale?: boolean;
    /** executeMacro handler: `ddb.<type>.<file>` or a Foundry macro name / `Macro.<id>` uuid. */
    macroName?: string;
    /** Override for a ddbmacro activity's stored macro parameters, or the executeMacro parameters. */
    macroParameters?: string;
    /** Extra handler arguments (e.g. activityName, custom handler data), merged under the structured fields. */
    args?: Record<string, unknown>;
  }

  interface IMidiActivityProperties {
    ignoreTraits?: string[];
    triggeredActivityId?: string;
    triggeredActivityConditionText?: string;
    triggeredActivityTargets?: string;
    triggeredActivityRollAs?: string;
    autoConsume?: boolean;
    forceConsumeDialog?: string;
    forceRollDialog?: string;
    forceDamageDialog?: string;
    forceDialog?: boolean;
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
  }

  interface IMidiOverTimeProperties {
    turnChoice?: string;
    saveRemoves?: boolean;
    rollAs?: string;
    preRemoveConditionText?: string;
    postRemoveConditionText?: string;
    removeConditionBeforeActivity?: boolean;
    removeConditionText?: string;
  };

  /** Fields common to all activity types. */
  interface I5eActivityBase {
    _id?: string;
    uuid?: string;
    type?: string;
    sort?: number;
    name?: string;
    img?: string;
    activation?: I5eActivityActivation;
    behaviors?: I5eActivityBehavior[];
    consumption?: I5eActivityConsumption;
    description?: {
      chatFlavor?: string;
      /** dnd5e 6.0 chat description (HTMLField); falls back to `item.system.description.chat` on cards. */
      value?: string;
    };
    duration?: I5eActivityDuration;
    effects?: I5eActivityEffect[];
    flags?: {
      ddbimporter?: {
        isElixirAdditionalActivity?: boolean;
        activityRiders?: string[];
      };
      // some enrichers write midi properties via activity flags overrides
      midiProperties?: IMidiActivityProperties;
    };
    range?: I5eActivityRange;
    target?: I5eActivityTarget;
    uses?: I5eSystemLimitedUses;
    visibility?: I5eActivityVisibility;
    // Midi extensions
    midiProperties?: IMidiActivityProperties;
    overTimeProperties?: IMidiOverTimeProperties;
    otherActivity?: IActivity | null;
    useConditionText?: string;
    effectConditionText?: string;
  }

  // "none" suppresses the ability mod entirely, leaving only attack.bonus (dnd5e attack-data.mjs)
  type T5eActivityAttackAbility = T5eAbility | "spellcasting" | "none" | "";

  interface I5eActivityAttack {
    /** Still a persisted string in dnd5e 6.0. */
    ability?: T5eActivityAttackAbility;
    /** dnd5e 6.0 derives `attack.abilities` (Set, persisted: false) from `ability` - never write it. */
    // abilities?: never;
    bonus?: string;
    critical?: {
      threshold?: number;
    };
    flat?: boolean;
    type?: { value?: string; classification?: string };
  }

  interface I5eActivityDamage {
    critical?: {
      allow?: boolean;
      bonus?: string;
    };
    onSave?: string;
    includeBase?: boolean;
    parts?: Partial<I5eDamagePart>[];
    scaling?: I5eDamageScaling;
  }

  interface I5eAttackActivity extends I5eActivityBase {
    type: "attack";
    attack?: I5eActivityAttack;
    damage?: I5eActivityDamage;
  }

  interface I5eActivitySave {
    ability?: string[];
    /** dnd5e 6.0 FormulaField - appended to the target's roll, resolved against the OWNING actor's roll data. */
    bonus?: string;
    dc?: {
      calculation?: string;
      formula?: string;
      /** Derived AE target only in dnd5e 6.0 (persisted: false) - never write it. */
      // bonus?: never;
    };
    /** dnd5e 6.0 - gates whether the chat save button is visible to all (default true). */
    visible?: boolean;
    override?: boolean;
  }

  interface I5eSaveActivity extends I5eActivityBase {
    type: "save";
    save: I5eActivitySave;
    damage?: I5eActivityDamage;
  }

  interface I5eActivityRoll {
    name?: string;
    formula?: string;
    prompt?: boolean;
    visible?: boolean;
  }

  interface I5eUtilityActivity extends I5eActivityBase {
    type: "utility";
    roll?: I5eActivityRoll;
  }

  interface I5eDamageActivity extends I5eActivityBase {
    type: "damage";
    damage?: I5eActivityDamage;
  }

  interface I5eHealActivity extends I5eActivityBase {
    type: "heal";
    healing?: I5eDamagePart;
  }

  type I5eActivityCastSpellProperties = typeof DICTIONARY.spell.components[keyof typeof DICTIONARY.spell.components];
  interface I5eActivitySpell {
    challenge?: {
      /** FormulaField in dnd5e 6.0 - emit deterministic formula strings, not numbers. */
      attack?: string;
      save?: string;
      override: boolean;
    };
    level?: number | null;
    properties?: I5eActivityCastSpellProperties[];
    spellbook?: boolean;
    uuid?: string;
    ability?: string;
  }

  interface I5eCastActivity extends I5eActivityBase {
    type: "cast";
    spell?: I5eActivitySpell;
  }

  interface I5eSummonsMatch {
    proficiency?: boolean;
    attacks?: boolean;
    saves?: boolean;
    disposition?: boolean;
    ability?: string;
  }

  interface I5eSummonsBonuses {
    ac?: string;
    hp?: string;
    hd?: string;
    attackDamage?: string;
    saveDamage?: string;
    healing?: string;
  }

  interface I5eActivitiesSummon {
    identifier?: string;
    mode?: string;
    prompt?: boolean;
  }

  interface I5eSummonProfile {
    _id?: string;
    name?: string;
    uuid?: string;
    count?: string | null;
    cr?: string;
    level?: {
      min?: number | null;
      max?: number | null;
    };
    sizes?: TActorSizes[];
    types?: TCreatureTypes[];
    movement?: TMovementTypes[];
  }

  interface I5eSummonActivity extends I5eActivityBase {
    type?: "summon";
    bonuses?: I5eSummonsBonuses;
    creatureSizes?: TActorSizes[];
    creatureTypes?: TCreatureTypes[];
    match?: I5eSummonsMatch;
    profiles?: I5eSummonProfile[];
    summon?: I5eActivitiesSummon;
  }

  interface I5eActivityCheck {
    // dnd5e stores check.ability as a string, but some build paths supply arrays
    ability?: string | string[];
    associated?: string[];
    /** dnd5e 6.0 FormulaField - appended to the target's roll, resolved against the OWNING actor's roll data. */
    bonus?: string;
    dc?: {
      calculation?: string;
      formula?: string;
    };
    /** dnd5e 6.0 - gates whether the chat check button is visible to all (default true). */
    visible?: boolean;
  }

  interface I5eCheckActivity extends I5eActivityBase {
    type: "check";
    check: I5eActivityCheck;
  }

  interface IDDBActivityMacro {
    name: string;
    function: string;
    visible?: boolean;
    parameters?: string;
  }

  interface I5eDDBMacroActivity extends I5eActivityBase {
    type: "ddbmacro";
    macro: IDDBActivityMacro;
  }

  interface I5eActivityRestrictions {
    allowMagical?: boolean;
    categories?: string[];
    properties?: string[];
    type?: string;
  }

  interface I5eActivityEnchant {
    identifier?: string;
    self: boolean;
  };

  interface I5eEnchantActivity extends I5eActivityBase {
    type: "enchant";
    enchant: I5eActivityEnchant;
    restrictions: I5eActivityRestrictions;
  }

  interface I5eActivityVisibility {
    level?: {
      min?: number | null;
      max?: number | null;
    };
    requireAttunement?: boolean;
    requireIdentification?: boolean;
    requireMagic?: boolean;
    identifier?: string;
  }

  interface I5eActivityActivity {
    id?: string;
  }

  interface I5eForwardActivity extends I5eActivityBase {
    type: "forward";
    activity?: I5eActivityActivity;
  }

  interface I5eActivityTransform {
    customize?: boolean;
    /** dnd5e 6.0 - with mode "form", keep no original-form traces (Disguise Self-likes). */
    formless?: boolean;
    /** Moved to `visibility.identifier` in dnd5e 6.0 (auto-migrated). */
    identifier?: string;
    preset?: "wildshape" | "polymorph";
    /** dnd5e 6.0 adds "form": forms live in the activity's `effects[]`; `profiles[]` are ignored. */
    mode?: "cr" | "form" | "";
  }

  export interface I5eActivitySettings {
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

  interface I5eTransformActivity extends I5eActivityBase {
    type: "transform";
    transform?: I5eActivityTransform;
    settings?: I5eActivitySettings;
  };

  /**
   * dnd5e 6.0 teleport distance. Normally leave the whole object unset - the distance is derived
   * from the activity's `range` (`units: "any"` → Infinity). Only set `override: true` with
   * `value`/`units` for a custom distance; `value` is a deterministic formula ("" → Infinity).
   */
  interface I5eActivityTeleport {
    override?: boolean;
    units?: string;
    value?: string;
  }

  interface I5eTeleportActivity extends I5eActivityBase {
    type: "teleport";
    teleport?: I5eActivityTeleport;
  }

  type I5eActivity =
    | I5eAttackActivity
    | I5eSaveActivity
    | I5eUtilityActivity
    | I5eDamageActivity
    | I5eHealActivity
    | I5eCastActivity
    | I5eSummonActivity
    | I5eCheckActivity
    | I5eDDBMacroActivity
    | I5eEnchantActivity
    | I5eForwardActivity
    | I5eTransformActivity
    | I5eTeleportActivity;

  /**
   * The wide shape used by the DDB activity builder classes, which assemble an
   * arbitrary combination of parts before the data is stored as one of the
   * I5eActivity union members.
   */
  interface IActivityData extends I5eActivityBase {
    spell?: I5eActivitySpell;
    restrictions?: I5eActivityRestrictions;
    settings?: I5eActivitySettings;
    activity?: I5eActivityActivity;
    attack?: I5eActivityAttack;
    damage?: I5eActivityDamage;
    healing?: Partial<I5eDamagePart>;
    roll?: I5eActivityRoll;
    enchant?: I5eActivityEnchant;
    creatureSizes?: TActorSizes[];
    creatureTypes?: TCreatureTypes[];
    bonuses?: I5eSummonsBonuses;
    match?: I5eSummonsMatch;
    profiles?: I5eSummonProfile[];
    summon?: I5eActivitiesSummon;
    transform?: I5eActivityTransform;
    teleport?: I5eActivityTeleport;
    macro?: IDDBActivityMacro;
    save?: I5eActivitySave;
    check?: I5eActivityCheck;
  }
}

