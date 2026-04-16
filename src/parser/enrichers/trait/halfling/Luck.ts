import DDBEnricherData from "../../data/DDBEnricherData";

export default class Luck extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.halflingLucky"),
        ],
      },
    ];
  }

}
