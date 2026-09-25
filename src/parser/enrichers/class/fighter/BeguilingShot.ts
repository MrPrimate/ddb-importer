import _ArcaneShot2024Option from "./_ArcaneShot2024Option";

/**
 * AU 2024. The DDB action carries the damage and the Wisdom save; the Charmed rider lasts until
 * the start of the archer's next turn. The template is suppressed because the text's "allies
 * within 30 feet of the target" would otherwise be read as a 30 ft radius.
 */
export default class BeguilingShot extends _ArcaneShot2024Option {

  protected override get diceCount(): number {
    return 2;
  }

  protected override get damageType(): string {
    return "psychic";
  }

  override get activity(): IDDBActivityData | null {
    return {
      ...(super.activity ?? {}),
      noTemplate: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Beguiled",
        activityMatch: this.name,
        statuses: ["Charmed"],
        options: { expiry: "sourceStart" },
      },
    ];
  }

}
