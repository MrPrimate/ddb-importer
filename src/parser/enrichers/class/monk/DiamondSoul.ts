import DDBEnricherData from "../../data/DDBEnricherData";

export default class DiamondSoul extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.diamondSoul"),
        ],
      },
    ];
  }

}
