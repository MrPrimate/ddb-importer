/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class UseMagicDevice extends DDBEnricherMixin {

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
        DDBEnricherMixin.generateUpgradeChange("4", 10, "system.attributes.attunement.max"),
      ],
    }];
  }

}
