import DDBEnricherData from "../data/DDBEnricherData";

export default class FarRealmShard extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      activationType: "special",
      data: {
        damage: {
          onSave: "none",
        },
      },
    };
  }

}
