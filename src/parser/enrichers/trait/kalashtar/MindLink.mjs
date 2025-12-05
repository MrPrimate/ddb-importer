/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MindLink extends DDBEnricherData {

  get activity() {
    return {
      name: "Grant Telepathy",
      data: {
        range: {
          units: "spec",
          special: "Within sight",
        },
      },
    };
  }

  get effects() {
    // const value = this.ddbParser.isMuncher ? 10 : "";
    return [
      {
        name: "Mind Link: Telepathy",
        activityMatch: "Grant Telepathy",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(";Telepathy (Only with Origin Character)", 10, "system.traits.languages.custom"),
        ],
        duration: {
          seconds: 3600,
          hour: 1,
        },
      },
      {
        name: "Mind Link: Telepathy",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("@details.level * 10", 10, "system.traits.languages.communication.telepathy.value"),
        ],
      },
    ];
  }

}
