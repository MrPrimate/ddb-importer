import DDBEnricherData from "../data/DDBEnricherData";

export default class FueledSpellfire extends DDBEnricherData {
  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "enemy",
      data: {
        roll: {
          name: "Roll Largest Hit Dice",
          // the dice actually spent, which a "largest" spend takes from a smaller die once
          // the largest run out
          formula: "@consumed.hd",
        },
        consumption: {
          scaling: {
            allowed: true,
            max: "2",
          },
          spellSlot: true,
          targets: [
            {
              type: "hitDice",
              value: "1",
              target: "largest",
              scaling: {
                mode: "amount",
                formula: "",
              },
            },
          ],
        },
      },
    };
  }
}
