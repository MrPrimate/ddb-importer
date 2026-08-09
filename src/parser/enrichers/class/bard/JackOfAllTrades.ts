import DDBEnricherData from "../../data/DDBEnricherData";

export default class JackOfAllTrades extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.jackOfAllTrades"),
        ],
      },
    ];
  }

}
