import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The 15 ft cone, the Constitution save and the scaling damage all come from
 * the DDB action; what the parse cannot see is the per-legacy rider a failed
 * save triggers.
 */
export default class FloralBreathWeapon extends DDBEnricherData {

  static LEGACIES = ["Beauty", "Guardian", "Healer", "Poisoner", "Waterplant", "Wildflower"];

  get legacy(): string | null {
    const labels = (this.ddbParser._chosen ?? []).map((choice) => choice.label ?? "");
    return FloralBreathWeapon.LEGACIES.find((name) => labels.some((label) => label.includes(name))) ?? null;
  }

  get activityName(): string {
    const legacy = this.legacy;
    return legacy ? `Floral Breath Weapon: ${legacy}` : "Floral Breath Weapon";
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    switch (this.legacy) {
      case "Beauty":
        return [
          {
            name: "Charmed (Floral Breath Weapon)",
            activityMatch: this.activityName,
            statuses: ["Charmed"],
            options: {
              expiry: "targetEnd",
              description: "Charmed by the floral dragonborn until the end of its next turn.",
            },
          },
        ];
      case "Guardian":
        return [
          {
            name: "Distracted (Floral Breath Weapon)",
            activityMatch: this.activityName,
            options: {
              expiry: "targetEnd",
              description: "Disadvantage on attacks against creatures other than the floral dragonborn until the end of its next turn.",
            },
            ac5eChanges: [
              DDBEnricherData.ChangeHelper.ac5eChange(
                "effectOriginTokenId !== opponentId",
                20,
                "flags.automated-conditions-5e.attack.disadvantage",
              ),
            ],
          },
        ];
      case "Poisoner":
        return [
          {
            name: "Poisoned (Floral Breath Weapon)",
            activityMatch: this.activityName,
            statuses: ["Poisoned"],
            options: {
              expiry: "targetEnd",
              description: "Poisoned until the end of its next turn.",
            },
          },
        ];
      case "Waterplant":
        return [
          {
            name: "Prone (Floral Breath Weapon)",
            activityMatch: this.activityName,
            statuses: ["Prone"],
            options: {
              description: "Knocked Prone by the swirling petals.",
            },
          },
        ];
      default:
        return [];
    }
  }

}
