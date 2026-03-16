import DDBFeatureActivity from "./DDBFeatureActivity";
import DDBItemActivity from "./DDBItemActivity";
import DDBMonsterFeatureActivity from "./DDBMonsterFeatureActivity";
import DDBSpellActivity from "./DDBSpellActivity";
import DDBVehicleActivity from "./DDBVehicleActivity";

export {};

global {
  type IDDBActivityTypes = DDBFeatureActivity
    | DDBItemActivity
    | DDBSpellActivity
    | DDBVehicleActivity
    | DDBMonsterFeatureActivity;

  interface IDDBActivityBuild {
    // --- Activation / attack ---
    activationOverride?: I5eActivityActivation;
    attackData?: any;
    noManualActivation?: boolean;

    // --- Additional targets / consumption ---
    additionalTargets?: any[];
    consumeActivity?: any;
    consumeItem?: any;
    consumptionOverride?: I5eActivityConsumption;
    consumptionTargetOverrides?: I5eConsumptionTarget[];

    // --- Damage ---
    allowCritical?: boolean | null;
    criticalDamage?: string | null;
    damageParts?: I5eDamagePart[] | null;
    damageScalingOverride?: any;
    includeBaseDamage?: boolean;
    onSave?: string | null;
    /** @deprecated use onSave */
    onsave?: boolean | string;
    partialDamageParts?: number[];
    includeBase?: boolean;

    // --- Description / flavor ---
    chatFlavor?: string | null;
    data?: IActivityData;
    img?: string | null;

    // attacks
    attackOverride?: I5eActivityAttack;

    // --- Duration / range / target ---
    durationOverride?: I5eActivityDuration;
    rangeOverride?: I5eActivityRange;
    targetOverride?: I5eActivityTarget;

    // --- Save / spell / check ---
    checkOverride?: I5eActivityCheck;
    saveOverride?: I5eActivitySave;
    spellOverride?: I5eActivitySpell;

    // --- Healing ---
    healingChatFlavor?: string | null;
    healingPart?: I5eDamagePart;

    // --- Roll ---
    rollOverride?: I5eActivityRoll;

    // --- Uses ---
    usesOverride?: I5eSystemLimitedUses | I5eConsumableUses;

    // --- Macro ---
    ddbMacroOverride?: IDDBActivityMacro;

    // --- Spell-specific ---
    modRestrictionFilter?: any;
    modRestrictionFilterExcludes?: any;
    noSpellslot?: boolean;

    // --- Generate flags ---
    generateActivation?: boolean;
    generateAttack?: boolean;
    generateCheck?: boolean;
    generateConsumption?: boolean;
    generateDamage?: boolean;
    generateDDBMacro?: boolean;
    generateDescription?: boolean;
    generateDuration?: boolean;
    generateEffects?: boolean;
    generateEnchant?: boolean;
    generateHealing?: boolean;
    generateRange?: boolean;
    generateRoll?: boolean;
    generateSave?: boolean;
    generateSpell?: boolean;
    generateSummon?: boolean;
    generateTarget?: boolean;
    generateUses?: boolean;
    generateUtility?: boolean;
    generateCast?: boolean;

    // --- Misc flags ---
    noeffect?: boolean;
  }

  interface IDDBItemActivityBuild extends IDDBActivityBuild {
    criticalThreshold?: number | undefined;
  };

  interface IDDBFeatureActivityBuild extends IDDBActivityBuild {
    attackOverride?: any;
    includeBase?: boolean;
    noTemplate?: any;
    targetSelf?: any;
    rollOverrideName?: string | null;
  };

  interface IDDBSpellActivityBuild extends IDDBActivityBuild {
    noSpellslot?: boolean;
    modRestrictionFilter?: any;
    modRestrictionFilterExcludes?: any;
  };

  interface IDDBVehicleActivityBuild extends IDDBActivityBuild {
    saveData?: any;
  };

}
