import DDBEnricherData from "../data/DDBEnricherData";

export default class Enthrall extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];

    return [
      {
        name: "Enthralled",
        changes: [
          DDBEnricherData.ChangeHelper.addChange(
            "-10",
            20,
            "system.skills.prc.roll.bonus",
          ),
        ],
      },
    ];

  }

}
