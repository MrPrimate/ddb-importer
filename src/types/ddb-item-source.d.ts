// ---------------------------------------------------------------------------
// DDB Spell Source Interfaces
// Models the JSON returned by the DDB proxy API for spells.
// Leaf objects that are not yet fully typed use `any`.
// ---------------------------------------------------------------------------

export {};

global {

  // ---- Inventory ------------------------------------------------------------

  export interface IDDBItemProperty {
    id: number;
    name: string;
    description: string;
    notes: string | null;
  }

  export interface IDDBWeaponBehavior {
    baseItemId: number;
    baseTypeId: number;
    type: string;
    attackType: number;
    categoryId: number;
    properties: IDDBItemProperty[];
    damage: IDDBDamageDice;
    damageType: string;
    range: number;
    longRange: number;
    isMonkWeapon: boolean;
  }

  export interface IDDBItemDefinition extends IDDBCommonDefinition, IDDBSourcesDefinition {
    entityTypeId: number;
    definitionKey: string;
    snippet: string;
    type: string;
    filterType: string;
    subType: string | null;
    rarity: string;
    magic: boolean;
    isLegacy: boolean;
    isCustomItem: boolean;
    isConsumable: boolean;
    isContainer: boolean;
    isPack: boolean;
    isMonkWeapon: boolean;
    stackable: boolean;
    bundleSize: number;
    canAttune: boolean;
    attunementDescription: string;
    canEquip: boolean;
    canBeAddedToInventory: boolean;
    // Armor
    armorClass: number | null;
    armorTypeId: number | null;
    baseArmorName: string | null;
    stealthCheck: number | null;
    strengthRequirement: number | null;
    // Weapon / damage
    damage: IDDBDamageDice | null;
    damageType: string | null;
    attackType: number | null;
    range: number | null;
    longRange: number | null;
    fixedDamage: number | null;
    properties: IDDBItemProperty[] | null;
    weaponBehaviors: IDDBWeaponBehavior[];
    // Weight / cost
    weight: number;
    weightMultiplier: number;
    cost: number | null;
    // Container
    capacity: string;
    capacityWeight: number;
    // Category / grouping
    categoryId: number | null;
    gearTypeId: number | null;
    baseItemId: number | null;
    baseTypeId: number;
    groupedId: number | null;
    // Images
    avatarUrl: string | null;
    largeAvatarUrl: string | null;
    // Modifiers & sources
    grantedModifiers: IDDBModifier[];
    tags: string[];
    // Infusion
    levelInfusionGranted: number | null;
    version: string | null;
  }

  export interface IDDBInventoryLimitedUse {
    maxUses: number;
    numberUsed: number;
    resetType: string;
    resetTypeDescription: string;
  }

  export interface IDDBInventoryItem {
    id: number;
    entityTypeId: number;
    definitionId: number;
    definitionTypeId: number;
    definition: IDDBItemDefinition;
    quantity: number;
    equipped: boolean;
    isAttuned: boolean;
    chargesUsed: number;
    limitedUse: IDDBInventoryLimitedUse | null;
    displayAsAttack: boolean | null;
    currency: IDDBCurrencies | null;
    containerEntityId: number;
    containerEntityTypeId: number;
    containerDefinitionKey: string;
    equippedEntityId: number;
    equippedEntityTypeId: number;
    originDefinitionKey: string | null;
    originEntityId: number | null;
    originEntityTypeId: number | null;
  }

}
