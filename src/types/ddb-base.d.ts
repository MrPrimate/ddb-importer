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

  // ---- Modifiers ------------------------------------------------------------

  export interface IDDBBaseModifier {
    id: string;
    entityId: number | null;
    entityTypeId: number | null;
    type: string;
    subType: string;
    restriction: string;
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
