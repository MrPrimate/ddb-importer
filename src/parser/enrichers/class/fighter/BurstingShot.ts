import _ArcaneShot2024Option from "./_ArcaneShot2024Option";

export default class BurstingShot extends _ArcaneShot2024Option {

  protected override get diceCount(): number {
    return 2;
  }

  protected override get damageType(): string {
    return "force";
  }

  override get activity(): IDDBActivityData | null {
    const base = super.activity ?? {};
    return {
      ...base,
      data: {
        ...base.data,
        target: {
          affects: { type: "creature" },
          template: { type: "radius", size: "10", units: "ft" },
        },
      },
    };
  }

}
