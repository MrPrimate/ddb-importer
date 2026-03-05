import { DICTIONARY } from "../config/_module";

export {};

global {

  // ---- Activities -----------------------------------------------------------

  interface I5eActivityActivation {
    type?: activationCostType;
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
      chatFlavor: string;
    };
    duration?: I5eActivityDuration;
    effects?: I5eActivityEffect[];
     flags?: {
      ddbimporter?: {
        isElixirAdditionalActivity?: boolean;
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

  interface I5eActivityAttack {
    ability?: string;
    bonus?: string;
    critical?: {
      threshold?: number;
    };
    flat?: boolean;
    type?: { value: string; classification: string };
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
    dc?: {
      calculation?: string;
      formula?: string;
    };
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
        override: boolean;
    };
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

  interface I5eSummonActivity extends I5eActivityBase {
    type?: "summon";
    bonuses?: I5eSummonsBonuses;
    creatureSizes?: actorSizes[];
    creatureTypes?: creatureTypes[];
    match?: I5eSummonsMatch;
    profiles?: any[];
    summon?: I5eActivitiesSummon;
  }

  interface I5eActivityCheck {
    ability?: string[];
    associated?: string[];
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
    | I5eForwardActivity;

  type IActivityData = I5eBaseActivityBase
    & I5eAttackActivity
    & I5eSaveActivity
    & I5eUtilityActivity
    & I5eDamageActivity
    & I5eHealActivity
    & I5eCastActivity
    & I5eSummonActivity
    & I5eCheckActivity
    & I5eDDBMacroActivity
    & I5eEnchantActivity
    & I5eForwardActivity
    & {
      // transform activity not implemented yet
      settings?: I5eActivitySettings;
    };

  // interface IActivityData extends I5eActivityBase {
  //   spell?: I5eActivitySpell;
  //   restrictions?: I5eActivityRestrictions;
  //   settings?: I5eActivitySettings;
  //   activity?: I5eActivityActivity;
  //   attack?: I5eActivityAttack;
  //   damage?: I5eActivityDamage;
  //   healing?: Partial<I5eDamagePart>;
  //   roll?: I5eActivityRoll;
  //   enchant?: I5eActivityEnchant;
  //   creatureSizes?: string[];
  //   macro?: IDDBActivityMacro;
  //   save?: I5eActivitySave;
  //   check?: I5eActivityCheck;
  // }
}

