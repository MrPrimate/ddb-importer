import DDBEnricherData from "../../data/DDBEnricherData";

export default class HungeringMight extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Restore Hit Points",
      activationType: "special",
      targetType: "self",
      addActivityConsume: true,
      activationCondition: "Blooded and in Wrath of the Wild",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.wis.mod",
          types: ["healing"],
        }),
        uses: {
          spent: 0,
          max: "1",
          recovery: [
            { period: "turnStart", type: "recoverAll", formula: undefined },
          ],
        },
      },
    };
  }

}
