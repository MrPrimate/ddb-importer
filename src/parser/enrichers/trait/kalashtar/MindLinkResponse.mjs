/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MindLinkResponse extends DDBEnricherData {

  get activity() {
    return {
      data: {
        range: {
          units: "spec",
          special: "Within sight",
        },
      },
    };
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("Telepathy", 10, "system.traits.languages.custom"),
        ],
        duration: {
          seconds: 3600,
          hour: 1,
        },
      },
    ];
  }

}
