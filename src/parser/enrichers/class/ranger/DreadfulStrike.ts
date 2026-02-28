import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadfulStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["psychic"] })],
        },
        uses: {
          override: true,
          spent: null,
          max: "max(1, @abilities.wis.mod)",
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
