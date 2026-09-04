import DDBEnricherData from "../../data/DDBEnricherData";

export default class VestigeStrikeRanged extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Vestige's Strike (Ranged)",
      targetType: "creature",
      data: {
        attack: { ability: "spellcasting", type: { value: "ranged", classification: "spell" } },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              bonus: "3 + @abilities.cha.mod",
              types: ["radiant", "fire", "necrotic"],
            }),
          ],
        },
        range: { value: "60", units: "ft" },
      },
    };
  }

}
