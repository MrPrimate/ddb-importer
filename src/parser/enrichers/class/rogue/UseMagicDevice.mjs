/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UseMagicDevice extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
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
