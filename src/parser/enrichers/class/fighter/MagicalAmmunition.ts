import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Arcane Archer (AU 2024): one imbued piece of ammunition per short rest, the three magical
 * properties folded onto the parent as activities instead of choice children, and the use can
 * be bought back with Second Wind.
 */
export default class MagicalAmmunition extends DDBEnricherData {

  override get noChoiceBuild(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Darkening Ammunition",
      addItemConsume: true,
      activationType: "action",
      targetType: "creature",
      data: {
        duration: { value: "1", units: "minute" },
        target: {
          affects: { type: "creature" },
          template: { type: "radius", size: "15", units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Unlocking Ammunition",
          data: { duration: { value: "", units: "inst" } },
        },
      },
      {
        duplicate: true,
        overrides: {
          name: "Vine Ammunition",
          noTemplate: true,
          targetType: "self",
          data: { duration: { value: "10", units: "minute" } },
        },
      },
      {
        init: {
          name: "Restore with Second Wind",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: { type: "none", value: null, condition: "" },
          consumptionOverride: {
            scaling: { allowed: false, max: "" },
            targets: [
              { type: "itemUses", target: "", value: -1, scaling: { mode: "", formula: "" } },
            ],
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Second Wind",
          targetType: "self",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Darkening Ammunition",
        activityMatch: "Darkening Ammunition",
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-5", 20, "system.skills.prc.bonuses.check"),
          DDBEnricherData.ChangeHelper.signedAddChange("-5", 20, "system.skills.prc.bonuses.passive"),
        ],
        options: { durationSeconds: 60 },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll" }],
      },
    };
  }

}
