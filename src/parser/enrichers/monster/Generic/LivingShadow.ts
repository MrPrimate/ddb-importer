import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

export default class LivingShadow extends _MonsterFeatureSupport {
  get resistsInShadow(): boolean {
    return (/While in Dim Light or Darkness.+Resistance to damage that isn't Force, Psychic, or Radiant/i).test(
      this.text,
    );
  }

  override get type(): IDDBActivityType | null {
    return this.resistsInShadow ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    return this.resistsInShadow
      ? {
        name: "Enter Shadow",
        activationType: "special",
        noConsumeTargets: true,
        targetSelf: true,
        noTemplate: true,
        activationCondition:
            "Apply while in Dim Light or Darkness. Remove immediately on leaving those lighting conditions.",
      }
      : null;
  }

  override get effects(): IDDBEffectHint[] {
    return this.resistsInShadow
      ? [
        {
          name: "Living Shadow",
          activityMatch: "Enter Shadow",
          changes: _MonsterFeatureSupport
            .allDamageTypes(["force", "psychic", "radiant"])
            .map((type) => _MonsterFeatureSupport.ChangeHelper.addChange(type, 20, "system.traits.dr.value")),
          options: {
            expiry: null,
            durationSeconds: null,
            description: "Active only in Dim Light or Darkness. Apply and remove manually when lighting changes.",
          },
        },
      ]
      : [];
  }
}
