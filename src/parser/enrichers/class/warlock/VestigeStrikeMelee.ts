import DDBEnricherData from "../../data/DDBEnricherData";

export default class VestigeStrikeMelee extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Vestige's Strike (Melee)",
      targetType: "creature",
      data: {
        attack: { ability: "spellcasting", type: { value: "melee", classification: "spell" } },
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
        range: { value: "5", units: "ft" },
      },
    };
  }

}
