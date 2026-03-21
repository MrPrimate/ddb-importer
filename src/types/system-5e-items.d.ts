// ---------------------------------------------------------------------------
// Foundry VTT dnd5e system – Actor document interfaces
// ---------------------------------------------------------------------------


export {};

global {

  type TFeatureType = "background" | "class" | "feat" | "race" | "supernaturalGift" | "vehicle" | "enchantment";

  type TFeatureClassSubtype = "arcaneShot" | "artificerInfusion" | "channelDivinity" | "constellation" | "defensiveTactic" | "eldritchInvocation" | "elementalDiscipline" | "fightingStyle" | "huntersPrey" | "ki" | "maneuver" | "metamagic" | "multiattack" | "pact" | "psionicPower" | "rune" | "superiorHuntersDefense";

  type TFeatureEnchantmentSubtype = "artificerInfusion" | "rune";

  type TFeatureFeatSubtype = "dragonmark" | "epicBoon" | "fightingStyle" | "general" | "origin";

  type TFeatureSupernaturalGiftSubtype = "blessing" | "charm" | "epicBoon";

  type TArmorType = "light" | "medium" | "heavy" | "shield" | "natural";

  type TItemRarity = "" | "common" | "uncommon" | "rare" | "veryRare" | "legendary" | "artifact";

  type TWeaponMastery = "cleave" | "graze" | "nick" | "push" | "sap" | "slow" | "topple" | "vex";

  type TLootTypes = "art" | "gear" | "gem" | "junk" | "material" | "resource" | "trade" | "treasure";

  type TWeightUnits = "lb" | "kg" | "tn" | "Mg";

  type TVolumeUnits = "cubicFoot" | "litre";

  type TTemplateUnits = "ft" | "mi";

  type TEquipmentTypes = TArmorType | "clothing" | "ring" | "rod" | "trinket" | "vehicle" | "wand" | "wondrous";

  type TWeaponType = "simpleM"
    | "simpleR"
    | "martialM"
    | "martialR"
    | "natural"
    | "improv"
    | "siege"
    | "advancedM"
    | "advancedR";

  type baseWeapon = ""
     | "club"
     | "lightcrossbow"
     | "dagger"
     | "dart"
     | "greatclub"
     | "handaxe"
     | "javelin"
     | "lighthammer"
     | "mace"
     | "quarterstaff"
     | "shortbow"
     | "sickle"
     | "sling"
     | "spear"
     | "battleaxe"
     | "blowgun"
     | "handcrossbow"
     | "heavycrossbow"
     | "flail"
     | "glaive"
     | "greataxe"
     | "greatsword"
     | "halberd"
     | "lance"
     | "longbow"
     | "longsword"
     | "maul"
     | "morningstar"
     | "musket"
     | "net"
     | "pike"
     | "pistol"
     | "rapier"
     | "scimitar"
     | "shortsword"
     | "trident"
     | "warpick"
     | "warhammer"
     | "whip";

  type T5eInventoryTypes = "weapon" | "equipment" | "container" | "consumable" | "tool" | "loot";

  // ---- Item flag sub-types --------------------------------------------------

  interface I5eMonsterMunchItemFlags {
    titleHTML: string;
    fullName: string;
    actionCopy: boolean;
    type: TDDBMonsterActionType;
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
    period: TLimitedUsePeriod;
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

  interface I5eItemWeight {
    value: number;
    units: TWeightUnits;
  }

  // ---- Damage parts ---------------------------------------------------------

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

  interface I5eWeaponRange {
    long?: number | null;
    reach?: number | null;
    value?: number | null;
    units: TDistanceUnit;
  }

  interface I5eWeaponDamageBase extends I5eDamageBase {
    versatile?: I5eDamagePart;
  }

  interface I5eWeaponSystemData {
    activities: Record<string, I5eActivity>;
    advancement?: I5eAdvancement[];
    ammunition?: Record<string, any>;
    armor?: Record<string, any>;
    attuned: boolean;
    attunement: string;
    container?: string | null;
    crew?: { value: any[] };
    damage: I5eWeaponDamageBase;
    description: I5eItemDescription;
    equipped: boolean;
    identified: boolean;
    identifier: string;
    mastery?: TWeaponMastery | null;
    price: I5ePrice;
    proficient: boolean | null;
    properties: TWeaponProperties[];
    quantity: number;
    range: I5eWeaponRange;
    rarity: TItemRarity;
    requirements: string;
    source: I5eSourceInfo;
    type: {
      value: TWeaponType;
      baseItem: baseWeapon;
    };
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
      infusions?: { infused: boolean };
    };
  }

  // ---- Feat item ------------------------------------------------------------

  interface I5eFeatSystemData {
    activities: Record<string, I5eActivity>;
    advancement?: I5eAdvancement[];
    crewed?: boolean;
    description: I5eItemDescription;
    enchant?: Record<string, any>;
    identifier: string;
    prerequisites: { items: any[]; repeatable: boolean };
    proficient?: boolean;
    properties: TFeatProperties[];
    requirements: string;
    source: I5eSourceInfo;
    type: {
      value: TFeatureType;
      subtype: TFeatureClassSubtype | TFeatureEnchantmentSubtype | TFeatureFeatSubtype | TFeatureSupernaturalGiftSubtype;
    };
    uses: I5eSystemLimitedUses;
  }

  interface I5eFeatItem extends I5eSystemBaseDocumentData {
    type: "feat";
    system: I5eFeatSystemData;
    flags: IItemFlagConfig & {
      monsterMunch?: I5eMonsterMunchItemFlags;
      midiProperties?: I5eMidiItemProperties;
      infusions?: { infused: boolean };
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
    units?: TDurationUnit;
    value?: string;
  }

  interface I5eSystemTargetData {
    prompt?: boolean;
    template?: {
      count?: string;
      contiguous?: boolean;
      type?: TTemplate;
      size?: string;
      width?: string;
      height?: string;
      units?: TTemplateUnits;
    };
    affects?: {
      count?: string;
      type?: TTarget;
      choice?: boolean;
      special?: string;
    };
  }

  interface I5eSystemBaseRangeData {
    value?: string | number | null;
    units?: TDistanceUnit;
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
    properties: TSpellProperties[];
    range: I5eSystemBaseRangeData;
    school: string;
    source: I5eSourceInfo;
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
    properties: TEquipmentProperties[];
    quantity: number;
    rarity: TItemRarity;
    source: I5eSourceInfo;
    strength: number;
    type: {
      value: TEquipmentTypes;
      baseItem: string;
    };
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
      infusions?: { infused: boolean };
    };
  }

  // ---- Container item -------------------------------------------------------

  interface I5eContainerCapacityWeight {
    value?: number;
    units?: TWeightUnits;
  }

  interface I5eContainerCapacityVolume {
    units?: TVolumeUnits;
    value?: number;
  }

  interface I5eContainerCapacity {
    count?: number;
    weight?: I5eContainerCapacityWeight;
    volume?: I5eContainerCapacityVolume;
  }

  interface I5eContainerSystemData {
    description: I5eItemDescription;
    identifier: string;
    source: I5eSourceInfo;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: TItemRarity;
    attunement: string;
    currency: I5eCurrency;
    capacity: I5eContainerCapacity;
    properties: TContainerProperties[];
    attuned: boolean;
    equipped: boolean;
    // not sure this is right
    uses?: I5eSystemLimitedUses;
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
    source: I5eSourceInfo;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: TItemRarity;
    attunement: string;
    ability: string;
    bonus: string;
    chatFlavor: string;
    proficient: number;
    properties: TToolProperties[];
    type: { value: string; baseItem: string };
    attuned: boolean;
    equipped: boolean;
  }

  interface I5eToolItem  extends I5eSystemBaseDocumentData {
    type: "tool";
    system: I5eToolSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Consumable item --------------------------------------------------

  interface I5eConsumableDamageBase {
    types: I5eDamageType[];
    custom?: {
      enabled: boolean;
    };
    scaling?: {
      number: number;
    };
  }

  interface I5eConsumableDamage {
    base: I5eConsumableDamageBase;
    replace: boolean;
  }

  interface I5eConsumableUses extends I5eSystemLimitedUses {
    autoDestroy: boolean;
  }

  interface I5eConsumableSystemData {
    activities: Record<string, I5eActivity>;
    uses: I5eConsumableUses;
    description: I5eItemDescription;
    identifier: string;
    source: I5eSourceInfo;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: TItemRarity;
    attunement: string;
    attuned: boolean;
    equipped: boolean;
    damage: I5eConsumableDamage;
    properties: TConsumableProperties[];
    type: { value: string; subtype: string };
  }

  interface I5eConsumableItem extends I5eSystemBaseDocumentData {
    type: "consumable";
    system: I5eConsumableSystemData;
    flags: IItemFlagConfig & {
      infusions?: { maps: any[]; applied: any[]; infused: boolean };
      midiProperties?: I5eMidiItemProperties;
    };
  }

  // ---- Loot item ------------------------------------------------------------

  interface I5eLootSystemData {
    description: I5eItemDescription;
    identifier: string;
    source: I5eSourceInfo;
    identified: boolean;
    unidentified: { description: string };
    container: string | null;
    quantity: number;
    weight: I5eItemWeight;
    price: I5ePrice;
    rarity: TItemRarity;
    properties: string[];
    type: {
      value: TLootTypes;
      subtype: string;
    };
  }

  interface I5eLootItem extends I5eSystemBaseDocumentData {
    type: "loot";
    system: I5eLootSystemData;
    flags: IItemFlagConfig;
  }

  // ---- Item union ---------------------------------------------------

  export type I5eInventoryItem =
    | I5eWeaponItem
    | I5eEquipmentItem
    | I5eContainerItem
    | I5eConsumableItem
    | I5eToolItem
    | I5eLootItem;

}
