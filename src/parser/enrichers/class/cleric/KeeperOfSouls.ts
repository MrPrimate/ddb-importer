import DDBEnricherData from "../../data/DDBEnricherData";

export default class KeeperOfSouls extends DDBEnricherData {

  // the most Hit Dice of any monster on record (Demilich, 72), the scaling ceiling for the heal
  static MAX_MONSTER_HIT_DICE = 72;

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "creature",
      // once until the start of your next turn
      noConsumeTargets: true,
      addActivityConsume: true,
      data: {
        uses: {
          spent: 0,
          max: "1",
          recovery: [{ period: "turnStart", type: "recoverAll" }],
        },
        description: {
          chatFlavor: "Enemy dies within 60 feet of you.",
        },
        // the dying enemy's number of Hit Dice, picked as the scaling when used
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scaling",
          types: ["healing"],
        }),
        consumption: {
          scaling: {
            allowed: true,
            max: String(KeeperOfSouls.MAX_MONSTER_HIT_DICE),
          },
        },
      },
    };
  }

}
