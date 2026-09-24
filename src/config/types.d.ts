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
}
