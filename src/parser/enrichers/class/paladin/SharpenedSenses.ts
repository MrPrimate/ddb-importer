import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Eldritch Hunt: Blindsight out to the Aura of Protection's range. DDB sends the
 * blindsight modifier with no value, only the restriction "Within the Range of Aura of Protection".
 */
export default class SharpenedSenses extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        changesOverwrite: true,
        options: {
          transfer: true,
          description: "You have Blindsight within the range of your Aura of Protection.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 10, "system.attributes.senses.ranges.blindsight"),
        ],
        // Foundry 13 casts an @ reference in a numeric change to NaN, so the aura range only
        // follows the scale value when DAE resolves it; the plain change is the base 10 feet
        daeChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("@scale.paladin.aura-of-protection", 10, "system.attributes.senses.ranges.blindsight"),
        ],
      },
    ];
  }

}
