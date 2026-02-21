import DDBEnricherData from "../../data/DDBEnricherData";

export default class SearUndead extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you Turn Undead",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@abilities.wis.mod)d8",
              types: ["radiant"],
            }),
          ],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "system.type.subtype": "channelDivinity",
      },
    };
  }
}
