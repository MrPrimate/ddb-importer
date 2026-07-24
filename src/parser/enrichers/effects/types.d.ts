export {};

global {
  // effect data built by the helpers in this directory always has these
  // containers initialised, so narrow the shared I5eEffectData shape here
  export type TChangeEffect = I5eEffectData & {
    system: I5eEffectSystem & { changes: IActiveEffectChangeData[] };
  };

  export type TAutoEffect = TChangeEffect & {
    statuses: string[];
    duration: IEffectDuration;
    flags: NonNullable<I5eEffectData["flags"]>;
  };
}
