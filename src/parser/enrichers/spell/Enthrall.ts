import DDBEnricherData from "../data/DDBEnricherData";

export default class Enthrall extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    if (this.is2014) return null;

    return [
      {
        name: "Enthralled",
        changes: [
          DDBEnricherData.ChangeHelper.addChange(
            "-10",
            20,
            "system.skills.prc.bonuses.check",
          ),
        ],
      },
    ];

  }

}
