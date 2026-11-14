import Generic from "../Generic";

/**
 * Light Domain Warding Flare. In the 2024 printing Improved Warding Flare (6th level) moves the
 * recovery from a Long Rest to a Short Rest. DDB only gives the rest at the import level, so the
 * period comes from a usage scale on the feature, as the PHB does. The 2014 feature always
 * recovers on a Long Rest.
 */
export default class WardingFlare extends Generic {

  static FEATURE_IDENTIFIER = "warding-flare";

  // DDB lists Warding Flare at 3rd and again at 6th level, and both merge into one item, so the
  // scale keeps a fixed id for the second pass to replace rather than duplicate
  static RECOVERY_ADVANCEMENT_ID = "ddbWardFlareRecv";

  override get additionalAdvancements(): I5eAdvancement[] {
    if (this.is2014) return [];
    return [
      {
        ...Generic.AdvancementBuilder.buildRecoveryScale({
          name: "Usage Recovery",
          identifier: "recovery",
          periods: { 3: "lr", 6: "sr" },
        }),
        _id: WardingFlare.RECOVERY_ADVANCEMENT_ID,
      },
    ];
  }

  override get override(): IDDBOverrideData | null {
    if (this.is2014) return null;
    return {
      uses: {
        ...foundry.utils.deepClone(this.data?.system?.uses ?? {}),
        recovery: [{ period: `@scale.${WardingFlare.FEATURE_IDENTIFIER}.recovery` as TLimitedUsePeriod, type: "recoverAll" }],
      },
      data: {
        flags: this.classAdvancementRootFlags("Cleric"),
        system: { identifier: WardingFlare.FEATURE_IDENTIFIER },
      },
    };
  }

}
