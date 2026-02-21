import DDBEnricherData from "../../data/DDBEnricherData";

export default class MindlessRage extends DDBEnricherData {

  get effects() {
    return [
      {
        // options: {
        //   transfer: true,
        //   disabled: true,
        // },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("frighened", 20, "system.traits.ci.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("charmed", 20, "system.traits.ci.value"),
        ],
      },
    ];
  }

}
