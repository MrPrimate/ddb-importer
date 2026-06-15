export {};

global {

  interface ISpellTattooConfigurationValue {
    level: number;
    rarity: string;
    abilityMod: number;
    dc: number;
    bonus: number;
    identity: string;
    name: string;
  };

  interface SpellTattooConfiguration {
    level?: number;
    values?: ISpellTattooConfigurationValue;
    dialog?: boolean;
    name?: string;
  }
}
