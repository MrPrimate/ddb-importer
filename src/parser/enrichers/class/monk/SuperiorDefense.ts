import DDBEnricherData from "../../data/DDBEnricherData";

export default class SuperiorDefense extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
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
