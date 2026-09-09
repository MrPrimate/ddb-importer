export interface IPublisherAmmunitionType {
  // the dnd5e ammunition subtype key
  key: string;
  // the label injected into CONFIG.DND5E.consumableTypes.ammo.subtypes
  label: string;
  // matched as whole words anywhere in the item name, because DDB ships these
  // with count suffixes ("Shells (10)") and prefixes ("Portable Cannonballs")
  itemNames: string[];
  // DDB weapon `type` values that use this ammunition.
  weaponTypes: string[];
}

export const AMMUNITION: { mageHandPress: IPublisherAmmunitionType[] } = {
  // Mage Hand Press (DDB source category 32) ammunition, injected into
  // CONFIG.DND5E.consumableTypes.ammo.subtypes when the items are in the
  // compendium.
  mageHandPress: [
    {
      key: "shells",
      label: "Shells",
      itemNames: ["shells"],
      weaponTypes: ["Double-Barrel Shotgun", "Pump Shotgun"],
    },
    {
      key: "shot",
      label: "Shot",
      itemNames: ["shot"],
      weaponTypes: ["Blunderbuss"],
    },
    {
      key: "cannonballs",
      label: "Cannonballs",
      itemNames: ["cannonballs", "cannonball"],
      // the Cannon is handled by its own item enricher, since other publishers
      // use that name too -- see src/parser/enrichers/item/Cannon.ts
      weaponTypes: [],
    },
    {
      key: "flares",
      label: "Flares",
      itemNames: ["flares", "flare"],
      weaponTypes: ["Flare Gun"],
    },
  ],
};
