import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Free action checks for detaching a creature or freeing stuck equipment. */
export default abstract class _MonsterDetachCheck extends _MonsterFeatureSupport {
  protected abstract get checkName(): string;

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const check = this.check();
    return check
      ? [
        this.extra(this.checkName, "ddbExtraCheck001", "check", {
          generateCheck: true,
          checkOverride: check,
          activationOverride: {
            type: "action",
            value: 1,
            condition:
                "Use the actor, reach, and eligibility requirements in the feature description. Remove the attachment or other condition on success.",
          },
        }),
      ]
      : [];
  }
}
