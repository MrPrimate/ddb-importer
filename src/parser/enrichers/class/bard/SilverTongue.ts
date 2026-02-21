import DDBEnricherData from "../../data/DDBEnricherData";

export default class SilverTongue extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
          description: "When you make a [[/check skill=per]] or [[/check skill=dec]] check, you can treat a d20 roll of 9 or lower as a 10.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "system.skills.dec.roll.min"),
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "system.skills.per.roll.min"),
        ],
      },
    ];
  }

}
