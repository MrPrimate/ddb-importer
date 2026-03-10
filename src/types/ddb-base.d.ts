export {};

global {

  interface IDDBCommonDefinition {
    id: number;
    name: string;
    description: string;
    snippet: string | null;
    componentId?: number | null;
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
    dice: any | null;
    availableToMulticlass: boolean;
    tagConstraints: any[];
  }

  export interface IDDBModifiers extends IDDBSourceCategorized<IDDBModifier[]> {
    condition: IDDBModifier[];
  }


}
