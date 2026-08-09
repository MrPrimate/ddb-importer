import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadIncarnate extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("min3", 20, "system.scale.rogue.sneak-attack.modifiers"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
