// ---------------------------------------------------------------------------
// Foundry VTT dnd5e system – Vehicle actor document interfaces
// ---------------------------------------------------------------------------

export {};

global {

  // ---- Vehicle Hit Points ---------------------------------------------------

  /** Extends base HP with vehicle-specific damage threshold fields. */
  interface I5eVehicleHitPoints extends I5eHitPoints {
    dt?: number | null;   // damage threshold – ignore damage below this value
    mt?: number | null;   // misses threshold
  }

  // ---- Vehicle Action Stations ----------------------------------------------

  /** HP thresholds at which the vehicle loses action stations. */
  interface I5eVehicleActionThresholds {
    0?: number | null;
    1?: number | null;
    2?: number | null;
  }

  /** Tracks the vehicle's action economy (crew-operated action stations). */
  interface I5eVehicleActions {
    max?: number;
    spent?: number;
    stations?: boolean;
    thresholds?: I5eVehicleActionThresholds;
  }

  // ---- Vehicle Capacity -----------------------------------------------------

  interface I5eVehicleCapacityCargo {
    value?: number;
    units?: string;   // typically "tn" (tons)
  }

  interface I5eVehicleCapacity {
    creature?: string;               // e.g. "30 crew, 20 passengers"
    cargo?: I5eVehicleCapacityCargo;
  }

  // ---- Vehicle Travel -------------------------------------------------------

  /** Travel paces and calculated speeds across movement modes. */
  interface I5eVehicleTravel {
    paces?: Record<string, string>;   // e.g. { water: "40" }
    speeds?: Record<string, string>;  // calculated mph per mode
    time?: number;                    // hours in travel day (24)
    units?: string;                   // "mph"
  }

  // ---- Vehicle Quality ------------------------------------------------------

  interface I5eVehicleQuality {
    value?: number;
  }

  // ---- Vehicle Attributes ---------------------------------------------------

  /**
   * Vehicle-specific attributes object.
   * Omits PC/NPC-only fields (concentration, death saves, hit dice, attunement,
   * senses, spellcasting) and adds vehicle-specific action stations, capacity,
   * travel, and quality.
   */
  interface I5eVehicleAttributes {
    ac?: I5eArmorClass;
    actions?: I5eVehicleActions;
    capacity?: I5eVehicleCapacity;
    hp?: I5eVehicleHitPoints;
    init?: I5eInitiative;
    movement?: I5eMovement;
    price?: I5ePrice;
    quality?: I5eVehicleQuality;
    travel?: I5eVehicleTravel;
  }

  // ---- Vehicle Traits -------------------------------------------------------

  /** Measurement with units, used for keel and beam dimensions. */
  interface I5eVehicleMeasurement {
    value?: number;
    units?: string;
  }

  /** Extends I5eTraits with ship/vehicle-specific dimension fields. */
  interface I5eVehicleTraits extends I5eTraits {
    keel?: I5eVehicleMeasurement;
    beam?: I5eVehicleMeasurement;
    dimensions?: string;            // e.g. "(140 ft. by 30 ft.)"
    weight?: { units?: string };
  }

  // ---- Vehicle Details ------------------------------------------------------

  interface I5eVehicleDetails {
    biography?: I5eBiography;
    type?: "air" | "water" | "land" | string;
  }

  // ---- Crew / Passenger / Cargo Lists ---------------------------------------

  interface I5eVehicleCrewList {
    max?: number | null;
    value?: any[];
  }

  interface I5eVehicleCargo {
    crew?: any[];
    passengers?: any[];
  }

  // ---- Vehicle System Data --------------------------------------------------

  interface I5eVehicleSystemData {
    abilities?: I5eAbilities;
    attributes?: I5eVehicleAttributes;
    cargo?: I5eVehicleCargo;
    crew?: I5eVehicleCrewList;
    currency?: I5eCurrency;
    details?: I5eVehicleDetails;
    draft?: { value?: any[] };
    passengers?: I5eVehicleCrewList;
    source?: I5eSourceInfo;
    traits?: I5eVehicleTraits;
  }

  // ---- Vehicle Component HP -------------------------------------------------

  /** HP block for an individual vehicle component item (hull, ballista, etc.). */
  interface I5eVehicleComponentHP {
    value?: number;
    max?: number;
    dt?: number | null;     // component damage threshold
    conditions?: string;    // text description of damage conditions
  }

  // ---- Vehicle Weapon Item (siege weapons) ----------------------------------

  /** Extends weapon system data with component HP (armor and crew already present). */
  interface I5eVehicleWeaponSystemData extends I5eWeaponSystemData {
    hp?: I5eVehicleComponentHP;
  }

  interface I5eVehicleWeaponItem extends I5eSystemBaseDocumentData {
    type: "weapon";
    system: I5eVehicleWeaponSystemData;
    flags: IItemFlagConfig & { midiProperties?: I5eMidiItemProperties };
  }

  // ---- Vehicle Equipment Item (hull, sails, helm, oars) --------------------

  interface I5eVehicleEquipmentSpeed {
    value?: number;
    conditions?: string;    // e.g. "15 sailing into wind; 60 with wind"
    units?: string;
  }

  /** Extends equipment system data with component HP and movement speed. */
  interface I5eVehicleEquipmentSystemData extends I5eEquipmentSystemData {
    hp?: I5eVehicleComponentHP;
    speed?: I5eVehicleEquipmentSpeed;
  }

  interface I5eVehicleEquipmentItem extends I5eSystemBaseDocumentData {
    type: "equipment";
    system: I5eVehicleEquipmentSystemData;
    flags: IItemFlagConfig & { midiProperties?: I5eMidiItemProperties };
  }

  // ---- Vehicle Item Union ---------------------------------------------------

  type I5eVehicleItem = I5eVehicleWeaponItem | I5eVehicleEquipmentItem | I5eFeatItem;

  // ---- Vehicle DDB Importer Flags -------------------------------------------

  interface I5eVehicleDDBImporterConfigurations {
    DT?: string;      // vehicle display type: "spelljammer", "ship", etc.
    PCMT?: string;    // primary component manage type
    ST?: string;      // size type
    ETP?: boolean;
    EC?: boolean;
    EAS?: boolean;
    EL?: boolean;
    ECHP?: boolean;
    ECAC?: boolean;
    ECS?: boolean;
    ECMT?: boolean;
    ECDT?: boolean;
    ECACM?: boolean;
    ECCR?: boolean;
    ECC?: boolean;
    ECR?: boolean;
    EF?: boolean;
    ECT?: boolean;
    EFT?: boolean;
  }

  interface I5eVehicleDDBImporterFlags {
    id?: string;
    version?: string;
    configurations?: I5eVehicleDDBImporterConfigurations;
  }

  // ---- Top-level Vehicle Actor Document ------------------------------------

  interface I5eVehicleData extends I5eSystemBaseDocumentData {
    type: "vehicle";
    system: I5eVehicleSystemData;
    items: I5eVehicleItem[];
    flags?: IActorFlagConfig & {
      dnd5e?: { showVehicleAbilities?: boolean };
      monsterMunch?: IMonsterMunchFlags;
      ddbimporter?: I5eVehicleDDBImporterFlags;
    };
    prototypeToken?: I5ePrototypeToken;
  }

}
