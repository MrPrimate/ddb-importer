export {};

declare global {
  /** The icon metadata used by dnd5e, accepting both the label/icon and name/img forms. */
  interface ISystemIconDefinition {
    label?: string;
    name?: string;
    icon?: string;
    img?: string;
  }

  interface ISystemIconSources {
    damageTypes?: Record<string, ISystemIconDefinition>;
    conditionTypes?: Record<string, ISystemIconDefinition>;
    statusEffects?: Record<string, ISystemIconDefinition>;
    encumbrance?: { effects?: Record<string, ISystemIconDefinition> };
    bloodied?: ISystemIconDefinition;
  }

  interface ISystemIcon {
    id: string;
    category: "damage" | "status";
    name: string;
    path: string;
    color: string;
    fallbackName?: string;
  }

  /** A feature that summons a spell's creatures, see DICTIONARY.companions.SPELL_COMPANION_FEATURES_2024. */
  interface ISpellCompanionFeature {
    /** the spell whose stat block the feature's companions are built from */
    spell: string;
    /** roll data formula for the level the summon is cast at, standing in for the spell's `@item.level` */
    level: string;
  }

  /** A generic DDB item that holds one spell, see DICTIONARY.magicitems.spellCarriers. */
  interface IDDBSpellCarrier {
    kind: "scroll" | "tattoo" | "enspelled" | "gem";
    ddbName: RegExp;
    words: RegExp;
    ignoredProperties: ("vocal" | "somatic" | "material")[];
    printedValues: boolean;
    /** The activation the item casts with instead of the spell's casting time ("as an action"). */
    activation?: TActivationCost;
    /** The item holds a single casting: without uses of its own it gets one, which the cast spends. */
    singleUse?: boolean;
  }
}
