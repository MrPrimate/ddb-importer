import DDBEnricherData from "../../data/DDBEnricherData";

export default class UmbralForm extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Umbral Form",
        changes: DDBEnricherData.allDamageTypes(["force", "radiant"]).map((t) => {
          return DDBEnricherData.ChangeHelper.damageResistanceChange(t);
        }),
      },
    ];
  }

}
