import _ArcaneShot2024Option from "./_ArcaneShot2024Option";

export default class ShadowShot extends _ArcaneShot2024Option {

  protected override get damageType(): string {
    return "psychic";
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Shadowed",
        activityMatch: this.name,
        statuses: ["Blinded"],
        options: { expiry: "targetEnd" },
      },
    ];
  }

}
