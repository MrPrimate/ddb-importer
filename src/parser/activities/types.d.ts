import DDBFeatureActivity from "./DDBFeatureActivity";
import DDBItemActivity from "./DDBItemActivity";
import DDBMonsterFeatureActivity from "./DDBMonsterFeatureActivity";
import DDBSpellActivity from "./DDBSpellActivity";
import DDBVehicleActivity from "./DDBVehicleActivity";

export {};

global {
  type TDDBActivityTypes = DDBFeatureActivity
    | DDBItemActivity
    | DDBSpellActivity
    | DDBVehicleActivity
    | DDBMonsterFeatureActivity;

  interface IDDBActivityBuild {
    // --- Activation / attack ---
    activationOverride?: I5eActivityActivation | null;
    attackData?: any;
    noManualActivation?: boolean;

    // --- Additional targets / consumption ---
    additionalTargets?: any[] | null;
    consumeActivity?: any;
    consumeItem?: any;
    consumptionOverride?: I5eActivityConsumption | null;
    consumptionTargetOverrides?: I5eConsumptionTarget[] | null;

    // --- Damage ---
    allowCritical?: boolean | null;
    criticalDamage?: string | null;
    damageParts?: I5eDamagePart[] | null;
    damageScalingOverride?: any;
    includeBaseDamage?: boolean;
    onSave?: string | null;
    /** @deprecated use onSave */
    onsave?: boolean | string;
    partialDamageParts?: number[] | null;
    includeBase?: boolean;

    // --- Description / flavor ---
    chatFlavor?: string | null;
    data?: Partial<I5eActivity> | null;
    img?: string | null;

    // attacks
    attackOverride?: I5eActivityAttack | null;

    // --- Duration / range / target ---
    durationOverride?: I5eActivityDuration | null;
    rangeOverride?: I5eActivityRange | null;
    targetOverride?: I5eActivityTarget | null;

    // --- Save / spell / check ---
    checkOverride?: I5eActivityCheck | null;
    saveOverride?: I5eActivitySave | null;
    spellOverride?: I5eActivitySpell | null;

    // --- Healing ---
    healingChatFlavor?: string | null;
    /** either a raw damage part, or the parser's wrapper carrying the part plus chat flavor */
    healingPart?: I5eDamagePart | { part?: I5eDamagePart; chatFlavor?: string | null } | null;

    // --- Roll ---
    rollOverride?: I5eActivityRoll | null;

    // --- Uses ---
    usesOverride?: I5eSystemLimitedUses | I5eConsumableUses | null;

    // --- Macro ---
    ddbMacroOverride?: IDDBActivityMacro | null;

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

  type TDDBActivityBuildOptions = IDDBActivityBuild
    | IDDBItemActivityBuild
    | IDDBFeatureActivityBuild
    | IDDBSpellActivityBuild
    | IDDBVehicleActivityBuild;

  interface IDDBBasicActivityCreateOptions {
    document: I5ePCItem | I5eFeatureItem | I5eMonsterItem | I5eVehicleItem;
    type: IDDBActivityType;
    name?: string | null;
    character?: I5ePCData | I5eMonsterData | I5eVehicleData | null;
    enricher?: TDDBEnricher;
    nameIdPostfix?: string | null;
  }

}
