/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UmbralForm extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Umbral Form",
        changes: DDBEnricherData.allDamageTypes(["force", "radiant"]).map((t) => {
          return DDBEnricherData.ChangeHelper.addChange(t, 20, "system.traits.dr.value");
        }),
      },
    ];
  }

}
