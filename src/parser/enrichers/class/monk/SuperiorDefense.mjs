/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SuperiorDefense extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        changes: DDBEnricherData.allDamageTypes(["force"]).map((element) =>
          DDBEnricherData.ChangeHelper.damageResistanceChange(element),
        ),
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }
}
