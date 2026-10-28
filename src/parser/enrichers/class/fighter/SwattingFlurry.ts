import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Neko Duelist (OTFY). Once per turn the flurry adds up to five more attack rolls with the weapon,
 * each hit dealing 1d10 of the weapon's damage type. The attack rolls are made with the weapon; this
 * activity rolls the 1d10 for each hit.
 */
export default class SwattingFlurry extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Swatting Flurry Strike",
      activationType: "special",
      activationCondition: "Once on each of your turns, after hitting with a Melee weapon as part of the Attack action; roll once per flurry hit (up to five)",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 10,
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

}
