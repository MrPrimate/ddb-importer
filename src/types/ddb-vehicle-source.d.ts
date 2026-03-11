// ---------------------------------------------------------------------------
// DDB Vehicle Source Interfaces
// Models the JSON returned by the DDB proxy API for vehicles.
// ---------------------------------------------------------------------------

export {};

global {

  // ---- Sub-structures -------------------------------------------------------

  interface IDDBVehicleConfiguration {
    key: string;
    value: string | boolean;
  }

  interface IDDBVehicleStat {
    id: number;
    name: string;
    value: number;
  }

  interface IDDBVehicleCreatureCapacity {
    type: string;
    capacity: number;
    sizeId: number | null;
  }

  interface IDDBVehicleComponentActionSummary {
    name: string;
    description: string;
    sourceId: number | null;
    sourceChapterNumber: number | null;
  }

  interface IDDBVehicleLevel {
    id: string;
    name: string | null;
    description: string | null;
    maxComponentSlots: number;
  }

  interface IDDBVehicleFuelItem {
    definitionKey: string;
    amountPerCharge: number;
  }

  interface IDDBVehicleFuelData {
    maxAmount: number | null;
    fuelItems: IDDBVehicleFuelItem[];
  }

  interface IDDBVehicleActionActivation {
    activationTime: number;
    activationType: number;
  }

  interface IDDBVehicleActionRange {
    range: number | null;
    longRange: number | null;
    aoeType: number | null;
    aoeSize: number | null;
    hasAoeSpecialDescription: boolean;
    minimumRange: number | null;
  }

  interface IDDBVehicleAction {
    componentId: number;
    componentTypeId: number;
    id: string | null;
    entityTypeId: number | null;
    limitedUse: unknown | null;
    name: string | null;
    description: string | null;
    snippet: string | null;
    abilityModifierStatId: number | null;
    onMissDescription: string | null;
    saveFailDescription: string | null;
    saveSuccessDescription: string | null;
    saveStatId: number | null;
    fixedSaveDc: number | null;
    attackTypeRange: number | null;
    actionType: number | null;
    attackSubtype: number | null;
    dice: IDDBDamageDice | null;
    value: number | null;
    damageTypeId: number | null;
    isMartialArts: boolean;
    isProficient: boolean;
    spellRangeType: number | null;
    displayAsAttack: boolean;
    range: IDDBVehicleActionRange | null;
    activation: IDDBVehicleActionActivation;
    numberOfTargets: number | null;
    fixedToHit: number | null;
    ammunition: unknown | null;
  }

  interface IDDBVehicleFeature {
    name: string;
    description: string;
    displayOrder: number;
    actions: IDDBVehicleAction[];
  }

  interface IDDBVehicleComponentSpeedMode {
    movementId: number | null;
    value: number;
    description: string | null;
    restrictionsText: string | null;
  }

  interface IDDBVehicleComponentSpeed {
    type: string | null;
    modes: IDDBVehicleComponentSpeedMode[];
  }

  interface IDDBVehicleComponentType {
    type: string;
    adjustments: unknown[];
  }

  interface IDDBVehicleComponentCost {
    type: string;
    value: number;
    description: string | null;
  }

  interface IDDBVehicleComponentDefinition {
    id: string;
    definitionKey: string;
    groupType: "component" | "action-station" | null;
    name: string;
    description: string | null;
    armorClass: number;
    armorClassDescription: string | null;
    damageThreshold: number;
    mishapThreshold: number | null;
    hitPoints: number;
    requiredCrew: string | null;
    coverType: "half" | "three-quarters" | null;
    actionsDescription: string | null;
    speeds: IDDBVehicleComponentSpeed[];
    types: IDDBVehicleComponentType[];
    costs: IDDBVehicleComponentCost[];
    actions: IDDBVehicleAction[];
  }

  interface IDDBVehicleComponent {
    levelId: string;
    displayOrder: number;
    isRemovable: boolean;
    isPrimaryComponent: boolean;
    description: string | null;
    definitionKey: string;
    definition: IDDBVehicleComponentDefinition;
  }

  // ---- Vehicle source data --------------------------------------------------

  /** A single vehicle entry from the DDB proxy API. */
  export interface IDDBVehicleSourceData {
    // Identification
    id: string;
    name: string;
    slug: string;
    url: string;
    definitionKey: string;
    type: string;
    entityType: string;
    entityID: string;

    // Publishing / metadata
    isHomebrew: boolean;
    sources: IDDBSource[];
    sourceIds: number[];

    // Description & images
    description: string;
    avatarUrl: string;
    largeAvatarUrl: string;
    cardAvatarUrl: string | null;

    // Physical characteristics
    sizeId: number;
    sizeType: string | null;
    length: number | null;
    width: number | null;
    weight: number | null;
    displayType: string | null;

    // Capacity & movement
    cargoCapacity: number;
    cargoCapacityDescription: string | null;
    creatureCapacity: IDDBVehicleCreatureCapacity[];
    travelPace: number | null;
    travelPaceEffectiveHours: number | null;

    // Configuration
    configurations: IDDBVehicleConfiguration[];
    primaryComponentManageType: string | null;

    // Stats & levels
    stats: IDDBVehicleStat[];
    levels: IDDBVehicleLevel[];

    // Actions & features
    actionsText: string;
    componentActionSummaries: IDDBVehicleComponentActionSummary[];
    features: IDDBVehicleFeature[];
    actions: IDDBVehicleAction[];

    // Components
    components: IDDBVehicleComponent[];

    // Damage & conditions
    damageImmunities: number[];
    conditionImmunities: number[];
    enabledConditions: unknown[];

    // Fuel (optional)
    fuelData: IDDBVehicleFuelData | null;
  }

}
