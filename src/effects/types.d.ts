export {};

global {
  // Effects freshly built by AutoEffects.BaseEffect always have these containers initialized,
  // unlike arbitrary I5eEffectData which may omit them.
  export type TInitializedEffect = I5eEffectData & {
    system: Required<I5eEffectSystem>;
    duration: IEffectDuration;
    flags: NonNullable<I5eEffectData["flags"]> & {
      dae: NonNullable<NonNullable<I5eEffectData["flags"]>["dae"]>;
    };
  };
}
