export {};

global {
  interface IMuncherDefaultSetting {
    name: string;
    needed: boolean;
    chosen?: string | boolean;
  }
}
