import DDBEnricherData from "../../data/DDBEnricherData";

export default class PowerfulBuild extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.powerfulBuild"),
        ],
      },
    ];
  }

}
