import DDBEnricherData from "../../data/DDBEnricherData";

export default class WailsFromTheGrave extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Damage",
      addItemConsume: true,
      targetType: "creature",
      activationType: "special",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "(ceil(@scale.rogue.sneak-attack.number / 2))d@scale.rogue.sneak-attack.faces",
          types: ["necrotic"],
        }),
      ],
    };
  }

}
