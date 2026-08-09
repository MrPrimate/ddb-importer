import DDBEnricherData from "../../data/DDBEnricherData";

export default class UseMagicDevice extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Use Magic Device: Charges", type: "class" } },
      { action: { name: "Use Magic Device: Scroll", type: "class" } },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Attunement",
      options: {
        transfer: true,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("4", 10, "system.attributes.attunement.max"),
      ],
    }];
  }

}
