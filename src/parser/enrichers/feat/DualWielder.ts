import DDBEnricherData from "../data/DDBEnricherData";

export default class DualWielder extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.enhancedDualWielding"),
        ],
      },
    ];
  }

}
