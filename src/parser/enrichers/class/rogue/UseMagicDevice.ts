import DDBEnricherData from "../../data/DDBEnricherData";

export default class UseMagicDevice extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Use Magic Device: Charges", type: "class" } },
      { action: { name: "Use Magic Device: Scroll", type: "class" } },
    ];
  }

  get effects() {
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
