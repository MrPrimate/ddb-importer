import DDBEnricherData from "../../data/DDBEnricherData";

export default class WailsFromTheGrave extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Damage",
      addItemConsume: true,
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: `(ceil(@scale.${this.classIdentifier("Rogue")}.sneak-attack.number / 2))d@scale.${this.classIdentifier("Rogue")}.sneak-attack.faces`,
          types: ["necrotic"],
        }),
      ],
    };
  }

}
