import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

export default class ConferFireResistance extends _MonsterFeatureSupport {
  get protectsRider(): boolean {
    return (/(?:rider|riding).*/i).test(this.text) && (/resistance to fire damage/i).test(this.text);
  }

  override get type(): IDDBActivityType | null {
    return this.protectsRider ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    return this.protectsRider
      ? {
        name: "Protect Rider",
        activationType: "special",
        noConsumeTargets: true,
        targetType: "creature",
        targetCount: "1",
        noTemplate: true,
        activationCondition: "Apply only to a rider. Remove the resistance when it dismounts.",
      }
      : null;
  }

  override get effects(): IDDBEffectHint[] {
    return this.protectsRider
      ? [
        {
          name: "Rider: Fire Resistance",
          activityMatch: "Protect Rider",
          changes: [_MonsterFeatureSupport.ChangeHelper.addChange("fire", 20, "system.traits.dr.value")],
          options: {
            expiry: null,
            durationSeconds: null,
            description: "Remove when the protected creature stops riding the source.",
          },
        },
      ]
      : [];
  }
}
