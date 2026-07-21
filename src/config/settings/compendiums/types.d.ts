export {};

global {
  interface ICompendiumSetting {
    title: string;
    setting: string;
    type: string;
    image: string;
    auto: boolean;
    types: string[];
    version: number;
  }
}
