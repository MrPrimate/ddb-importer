import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Arcana Domain (AU 2024): both Channel Divinity riders are DDB actions on this feature,
 * pulled here so they spend the Channel Divinity pool rather than the feature's own uses.
 */
export default class ModifyMagic extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Channel Divinity: Fortifying Spell", type: "class" },
        overrides: { addItemConsume: true, itemConsumeTargetName: "Channel Divinity" },
      },
      {
        action: { name: "Channel Divinity: Tenacious Spell", type: "class" },
        overrides: { addItemConsume: true, itemConsumeTargetName: "Channel Divinity" },
      },
    ];
  }

}
