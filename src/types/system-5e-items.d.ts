// ---------------------------------------------------------------------------
// Foundry VTT dnd5e system – Actor document interfaces
// ---------------------------------------------------------------------------


export {};

global {

    // ---- Item flag sub-types --------------------------------------------------

  interface I5eMonsterMunchItemFlags {
    titleHTML: string;
    fullName: string;
    actionCopy: boolean;
    type: "action" | "special" | "legendary" | "bonus" | "reaction" | "lair" | "mythic";
    actionData: Record<string, any>;
  }

  interface I5eMidiItemProperties {
    saveDamage?: string;
    otherSaveDamage?: string;
    autoFailFriendly?: boolean;
    confirmTargets?: string;
    magicdam?: boolean;
    magiceffect?: boolean;
  }

  interface I5eSystemLimitedUsesRecovery {
    period: string;
    type: string;
    formula?: string | undefined;
  }

  interface I5eSystemLimitedUses {
    spent?: number | null;
    max?: string | null;
    recovery?: I5eSystemLimitedUsesRecovery[];
    override?: boolean;
  }

  // ---- Item shared sub-types ------------------------------------------------

  interface I5eItemDescription {
    value: string;
    chat: string;
  }

  // Uses I5eSystemLimitedUsesRecovery from system-5e.d.ts (identical shape)
  // Uses I5eSystemLimitedUses from system-5e.d.ts (identical shape)

  interface I5eItemSourceRef {
    book?: string;
    page?: string;
    license?: string;
    custom?: string;
    revision: number;
    rules: string;
  }

  interface I5eItemWeight {
    value: number;
    units: string;
  }

  // ---- Damage parts ---------------------------------------------------------

  interface I5eDamageScaling {
    mode?: string;
    number?: number | null;
    formula?: string;
  }

  interface I5eDamageCustom {
    enabled: boolean;
    formula: string;
  }

  export type I5eDamageType = "acid" | "bludgeoning" | "cold" | "fire" | "force" | "lightning" | "necrotic" | "piercing" | "poison" | "psychic" | "radiant" | "slashing" | "thunder" | string;

  interface I5eDamagePart {
    number: number;
    denomination: number;
    bonus: string;
    types: I5eDamageType[];
    custom?: I5eDamageCustom;
    scaling?: I5eDamageScaling;
  }

  interface I5eDamageBase {
    base?: I5eDamagePart;
    onSave?: string | null;
  }

  // -- Consumption Targets ----------------------------------------------------

  interface I5eConsumptionTargetScaling {
    allowed?: boolean;
    mode?: "" | "amount" | "level" | string;
    max?: string;
    formula?: string;
  }

  interface I5eConsumptionTarget {
    type: "itemUses" | "activityUses" | "spellSlots" | "attribute" | string;
    target: string;
    value: string | number;
    scaling?: I5eConsumptionTargetScaling;
  }

  // ---- Weapon item ----------------------------------------------------------

  interface I5eWeaponSystemData {
    activities: Record<string, I5eActivity>;
    advancement?: I5eAdvancement[];
    ammunition: Record<string, any>;
    armor: Record<string, any>;
    attuned: boolean;
    attunement: string;
    container: string | null;
    crew: { value: any[] };
    damage: I5eDamageBase;
    description: I5eItemDescription;
    equipped: boolean;
    identified: boolean;
    identifier: string;
    mastery?: string;
    price: I5ePrice;
    proficient: boolean | null;
    properties: string[];
    quantity: number;
    range: {
      value: number | null;
      long: number | null;
      units: string;
      reach: string;
    };
    rarity: string;
    requirements: string;
    source: I5eItemSourceRef;
    type: { value: string; baseItem: string };
    unidentified: { description: string };
    uses: I5eSystemLimitedUses;
    weight: I5eItemWeight;
  }

  interface I5eWeaponItem extends I5eSystemBaseDocumentData {
    type: "weapon";
    system: I5eWeaponSystemData;
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Feat item ------------------------------------------------------------

  interface I5eFeatSystemData {
    activities: Record<string, I5eActivity>;
    advancement?: I5eAdvancement[];
    crewed: boolean;
    description: I5eItemDescription;
    enchant: Record<string, any>;
    identifier: string;
    prerequisites: { items: any[]; repeatable: boolean };
    proficient?: boolean;
    properties: string[];
    requirements: string;
    source: I5eItemSourceRef;
    type: { value: string; subtype: string };
    uses: I5eSystemLimitedUses;
  }

  interface I5eFeatItem extends I5eSystemBaseDocumentData {
    type: "feat";
    system: I5eFeatSystemData;
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Spell item -----------------------------------------------------------

  interface I5eSpellMaterials {
    value: string;
    consumed: boolean;
    cost: number;
    supply: number;
  }

  interface I5eSystemActivationData {
    type?: string;
    value?: number;
    condition?: string;
  }

  interface I5eSystemDurationData {
    concentration?: boolean;
    special?: string;
    units?: string;
    value?: string;
  }

  interface I5eSystemTargetData {
    prompt?: boolean;
    template?: {
      count?: string;
      contiguous?: boolean;
      type?: string;
      size?: string;
      width?: string;
      height?: string;
      units?: string;
    };
    affects?: {
      count?: string;
      type?: string;
      choice?: boolean;
      special?: string;
    };
  }

  interface i5eSystemBaseRangeData {
    value?: string;
    units?: string;
    special?: string;
  }


  interface I5eSpellSystemData {
    activation: I5eSystemActivationData;
    activities: Record<string, I5eActivity>;
    description: I5eItemDescription;
    duration: I5eSystemDurationData;
    identifier: string;
    level: number;
    materials: I5eSpellMaterials;
    method: "atwill" | "innate" | "spell" | string;
    prepared: number;
    properties: string[];
    range: I5eSystemBaseRangeData;
    school: string;
    source: I5eItemSourceRef;
    target: I5eSystemTargetData;
    uses: I5eSystemLimitedUses;
    sourceClass?: string;
  }

  interface I5eSpellItem extends I5eSystemBaseDocumentData {
    type: "spell";
    system: I5eSpellSystemData;
    flags: IItemFlagConfig & {
      ddbimporter?: { dndbeyond: IParseSpellFlagDataDnDBeyond };
      "midi-qol"?: { removeAttackDamageButtons?: string };
      midiProperties?: I5eMidiItemProperties;
      "spell-class-filter-for-5e"?: Record<string, any>;
      "tidy5e-sheet"?: Record<string, any>;
    };
  }


  // ---- Equipment item -------------------------------------------------------

  interface I5eEquipmentSystemData {
    activities: Record<string, I5eActivity>;
    armor: { value: number | null; dex: number | null };
    attuned: boolean;
    attunement: string;
    container: string | null;
    crew: { value: any[] };
    description: I5eItemDescription;
    equipped: boolean;
    identified: boolean;
    identifier: string;
    price: I5ePrice;
    proficient: boolean | null;
    properties: string[];
    quantity: number;
    rarity: string;
    source: I5eItemSourceRef;
    strength: number;
    type: { value: string; baseItem: string };
    unidentified: { description: string };
    uses: I5eSystemLimitedUses;
    weight: I5eItemWeight;
  }

  interface I5eEquipmentItem extends I5eSystemBaseDocumentData {
    type: "equipment";
    system: I5eEquipmentSystemData;
    flags: IItemFlagConfig & {
      infusions?: { maps: any[]; applied: any[]; infused: boolean };
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Container item -------------------------------------------------------

  interface I5eContainerCapacityWeight {
    value?: number;
    units?: string;
  }

  interface I5eContainerCapacityVolume {
    units?: string;
  }

  interface I5eContainerCapacity {
    weight?: I5eContainerCapacityWeight;
    volume?: I5eContainerCapacityVolume;
  }

  interface I5eContainerSystemData {
    description: I5eItemDescription;
    identifier: string;
    source: I5eItemSourceRef;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: string;
    attunement: string;
    currency: I5eCurrency;
    capacity: I5eContainerCapacity;
    properties: string[];
    attuned: boolean;
    equipped: boolean;
  }

  interface I5eContainerItem extends I5eSystemBaseDocumentData {
    type: "container";
    system: I5eContainerSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Tool item ------------------------------------------------------------

  interface I5eToolSystemData {
    activities: Record<string, I5eActivity>;
    uses: I5eSystemLimitedUses;
    description: I5eItemDescription;
    identifier: string;
    source: I5eItemSourceRef;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: string;
    attunement: string;
    ability: string;
    bonus: string;
    chatFlavor: string;
    proficient: number;
    properties: string[];
    type: { value: string; baseItem: string };
    attuned: boolean;
    equipped: boolean;
  }

  interface I5eToolItem  extends I5eSystemBaseDocumentData {
    type: "tool";
    system: I5eToolSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Item union ---------------------------------------------------

  export type I5eMonsterItem =
    | I5eWeaponItem
    | I5eFeatItem
    | I5eSpellItem
    | I5eEquipmentItem
    | I5eContainerItem
    | I5eToolItem;

}
