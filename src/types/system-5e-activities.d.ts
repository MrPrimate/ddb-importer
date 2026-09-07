import { DICTIONARY } from "../config/_module";

export {};

global {

  // ---- Activities -----------------------------------------------------------

  interface I5eActivityActivation {
    type?: TActivationCost;
    value?: number;
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
    onSave?: boolean;
    riders?: {
      activity?: string[];
      effect?: string[];
      item?: string[];
    };
    level?: {
      min: number | null;
      max: number | null;
    };
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
    consumption?: I5eActivityConsumption;
    description?: {
      chatFlavor?: string;
      value?: string;
    };
    duration?: I5eActivityDuration;
    // most activity types carry damage; declared on the base so partial activity data built
    // by spreading a save/attack block type-checks
    damage?: I5eActivityDamage;
    effects?: I5eActivityEffect[];
    flags?: {
      ddbimporter?: {
        isElixirAdditionalActivity?: boolean;
        activityRiders?: string[];
        effectRiders?: string[];
        itemRiders?: string[];
        [key: string]: any;
      };
      dnd5e?: {
        /** Id of the applied enchantment (same item) this rider activity was created for; removed with it. */
        dependentOn?: string;
        [key: string]: unknown;
      };
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

  type T5eActivityAttackAbility = T5eAbility | "spellcasting" | "none" | "";

  interface I5eActivityAttack {
    ability?: T5eActivityAttackAbility | string;
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
    // dnd5e 6.0 FormulaField appended to the target's roll; accepted from shared enrichers, ignored on 5.x
    bonus?: string;
    dc?: {
      calculation?: string;
      formula?: string;
    };
    // dnd5e 6.0 gates the chat save button; accepted from shared enrichers, ignored on 5.x
    visible?: boolean;
    override?: boolean;
  }

  interface I5eSaveActivity extends I5eActivityBase {
    type: "save";
    save: I5eActivitySave;
    damage: I5eActivityDamage;
  }

  interface I5eActivityRoll {
    name?: string;
    formula?: string;
    prompt?: boolean;
    visible?: boolean;
  }

  interface I5eUtilityActivity extends I5eActivityBase {
    type: "utility";
    roll: I5eActivityRoll;
  }

  interface I5eDamageActivity extends I5eActivityBase {
    type: "damage";
    damage: I5eActivityDamage;
  }

  interface I5eHealActivity extends I5eActivityBase {
    type: "heal";
    healing?: I5eDamagePart;
  }

  type I5eActivityCastSpellProperties = typeof DICTIONARY.spell.components[keyof typeof DICTIONARY.spell.components];
  interface I5eActivitySpell {
    challenge?: {
      // NumberFields on dnd5e 5.x; shared enrichers may supply a numeric string, which the
      // system coerces
      attack?: number | string;
      save?: number | string;
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
    spell: I5eActivitySpell;
  }

  interface I5eSummonsMatch {
    proficiency?: boolean;
    attacks?: boolean;
    saves?: boolean;
    disposition?: boolean;
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
    movement?: string[];
    [key: string]: any;
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
    bonus?: string;
    visible?: boolean;
    dc?: {
      calculation?: string;
      formula?: string;
    };
  }

  interface I5eCheckActivity extends I5eActivityBase {
    type: "check";
    check: I5eActivityCheck;
    damage: {
      critical?: Record<string, any>;
      onSave?: string;
      parts: I5eDamagePart[];
    };
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
    profiles?: I5eSummonProfile[];
  };

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
    | I5eTransformActivity;

  /**
   * A permissive view of any activity's data, for code that handles activities before
   * their type is known (enricher overrides, snippet handling).
   */
  interface IActivityData extends I5eActivityBase {
    spell?: I5eActivitySpell;
    settings?: I5eActivitySettings;
    attack?: I5eActivityAttack;
    healing?: Partial<I5eDamagePart>;
    roll?: I5eActivityRoll;
    save?: I5eActivitySave;
    check?: I5eActivityCheck;
    [key: string]: any;
  }
}

