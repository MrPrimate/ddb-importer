import DDBEnricherData from "../../data/DDBEnricherData";

export default class SuperiorDefense extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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

  override get clearAutoEffects() {
    return true;
  }
}
