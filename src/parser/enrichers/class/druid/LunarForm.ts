import DDBEnricherData from "../../data/DDBEnricherData";

export default class LunarForm extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Lunar Radiance Damage",
      activationType: "special",
      activationCondition: "Once per turn, on hit, whilst in Wild Shape",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 10,
              type: "radiant",
            }),
          ],
        },
      },
    };
  }

}
