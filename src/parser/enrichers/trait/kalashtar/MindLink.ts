import DDBEnricherData from "../../data/DDBEnricherData";

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

  get effects(): IDDBEffectHint[] {
    // const value = this.ddbParser.isMuncher ? 10 : "";
    return [
      {
        name: "Mind Link: Telepathy",
        activityMatch: "Grant Telepathy",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(";Telepathy (Only with Origin Character)", 10, "system.traits.languages.custom"),
        ],
        data: {
          duration: {
            seconds: 3600,
          },
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
