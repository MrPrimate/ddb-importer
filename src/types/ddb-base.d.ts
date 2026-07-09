export {};

global {

  interface IDDBCommonDefinition {
    id: number;
    name: string;
    description: string;
    snippet: string | null;
    componentId?: number | null;
  }

  /**
   * Definitions that have action payload data merged onto them by the parser
   * (class features, racial traits and feats backed by a DDB action). Read by
   * the activity builders in src/parser/activities/DDBFeatureActivity.ts.
   */
  interface IDDBActionBackedDefinition extends IDDBCommonDefinition {
    range?: IDDBActionRange | null;
    fixedSaveDc?: number | null;
    abilityModifierStatId?: number | null;
    saveStatId?: number | null;
    actionType?: number | null;
    attackSubtype?: number | null;
    attackTypeRange?: number | null;
    isMartialArts?: boolean;
    rangeId?: number | null;
    statId?: number | null;
    isOffhand?: boolean;
    damageTypeId?: number | null;
    dice?: IDDBDamageDice | null;
    die?: IDDBDamageDice | null;
    isCustomAction?: boolean;
  }

  interface IDDBDamageDice {
    diceCount: number;
    diceValue: number;
    diceMultiplier: number | null;
    fixedValue: number | null;
    diceString: string;
  }

  // ---- Source info (shared by classes, races, backgrounds) -------------------

  export interface IDDBSource {
    sourceId: number;
    pageNumber: number | null;
    sourceType: number;
  }

  // Conditions
  type TDDBDamageConditionType = "immunity"
    | "resistance"
    | "vulnerability";

  type TDDBStatusConditionType = "immunity";

  // ---- Modifiers ------------------------------------------------------------

  type TDDBClassModifierNames = "wizard"
    | "sorcerer"
    | "warlock"
    | "druid"
    | "cleric"
    | "artificer"
    | "ranger"
    | "bard"
    | "fighter"
    | "paladin"
    | "rogue"
    | "monk";

  type TDDBModifierType = "bonus"
    | "advantage"
    | "disadvantage"
    | "set"
    | "set-base"
    | "language"
    | "proficiency"
    | "ignore"
    | "resistance"
    | "immunity"
    | "vulnerability"
    | "damage"
    | "stacking-bonus"
    | "sense"
    | "saving-throws"
    | "ability-checks"
    | "skill-checks"
    | "strength-saving-throws"
    | "dexterity-saving-throws"
    | "constitution-saving-throws"
    | "wisdom-saving-throws"
    | "intelligence-saving-throws"
    | "charisma-saving-throws"
    | "strength-ability-checks"
    | "dexterity-ability-checks"
    | "constitution-ability-checks"
    | "wisdom-ability-checks"
    | "intelligence-ability-checks"
    | "charisma-ability-checks"
    | "spell-attacks"
    | "melee-attacks"
    | "ranged-attacks"
    | "melee-weapon-attacks"
    | "ranged-weapon-attacks"
    | "weapon-attacks"
    | "melee-spell-attacks"
    | "ranged-spell-attacks"
    | "wizard-spell-attacks"
    | "artificer-spell-attacks"
    | "cleric-spell-attacks"
    | "druid-spell-attacks"
    | "bard-spell-attacks"
    | "sorcerer-spell-attacks"
    | "rogue-spell-attacks"
    | "warlock-spell-attacks"
    | "paladin-spell-attacks"
    | "ranger-spell-attacks"
    | "fighter-spell-attacks"
    | "monk-spell-attacks"
    | "spell-save-dc"
    | "wizard-spell-save-dc"
    | "cleric-spell-save-dc"
    | "druid-spell-save-dc"
    | "bard-spell-save-dc"
    | "sorcerer-spell-save-dc"
    | "warlock-spell-save-dc"
    | "paladin-spell-save-dc"
    | "ranger-spell-save-dc"
    | "fighter-spell-save-dc"
    | "artificer-spell-save-dc"
    | "rogue-spell-save-dc"
    | "monk-spell-save-dc"
    | "spell-group-healing"
    | "replace-damage-type"
    | "kensei"
    | "monk-weapon"
    | "weapon-property"
    | "half-proficiency"
    | "expertise";

  export interface IDDBBaseModifier {
    id: string;
    entityId: number | null;
    entityTypeId: number | null;
    type: TDDBModifierType;
    subType: string;
    restriction: string | null;
    statId: number | null;
    requiresAttunement: boolean;
    duration: any | null;
    friendlyTypeName: string;
    friendlySubtypeName: string;
    isGranted: boolean;
    bonusTypes: any[];
    value: string | number | null;
    fixedValue: number | null;
    availableToMulticlass: boolean | null;
    modifierTypeId: number;
    modifierSubTypeId: number;
    componentId: number;
    componentTypeId: number;
  }

  export interface IDDBModifier extends IDDBBaseModifier {
    entityId: number;
    entityTypeId: number;
    dice: IDDBDamageDice | null;
    // some modifiers (spell mods in particular) carry die instead of dice
    die?: IDDBDamageDice | null;
    availableToMulticlass: boolean;
    tagConstraints: any[];
  }

  export interface IDDBModifiers extends IDDBSourceCategorized<IDDBModifier[]> {
    condition: IDDBModifier[];
  }

  export interface IDDBBaseSourcesDefinition {
    sources?: IDDBSource[];
    isHomebrew?: boolean;
  }

  interface IDDBSourceIdAndPageDefinition {
    sourceId?: number;
    sourcePageNumber?: string;
  }

  export interface IDDBSourcesDefinition extends IDDBSourceIdAndPageDefinition, IDDBBaseSourcesDefinition {}

  export interface IDDBSourceIdsDefinition extends IDDBBaseSourcesDefinition {
    sourceIds?: number[];
  }

  type IModifiersMod = IDDBModifier | IDDBSpellModifier;

}
