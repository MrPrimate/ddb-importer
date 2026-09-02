import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The importer-built Guardian of Faith summon. Using Guardian Aura from the
 * guardian token places a 10-foot emanation attached to it; the region fires the
 * save for an enemy that moves within 10 feet for the first time on a turn
 * (2024 also when it starts its turn there). Each use spends 20 of the 60-damage
 * pool, so the guardian vanishes when the pool is exhausted (delete the region).
 */
export default class GuardianAura extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      activationType: "special",
      activationCondition: this.is2014
        ? "An enemy moves to a space within 10 feet of the guardian for the first time on a turn"
        : "An enemy moves to a space within 10 feet of the guardian for the first time on a turn or starts its turn there",
      addItemConsume: true,
      itemConsumeValue: "20",
      data: {
        target: {
          override: true,
          affects: {
            type: "enemy",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: this.is2014
              ? ["tokenEnter", "tokenMoveIn"]
              : ["tokenEnter", "tokenMoveIn", "tokenTurnStart"],
            excludeSelf: true,
          }),
        ],
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "20",
              type: "radiant",
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "60",
            recovery: [],
          },
        },
      },
    };
  }

}
