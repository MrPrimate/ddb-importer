import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Druid): chosen creatures in the Emanation have Resistance to Bludgeoning, Piercing and Slashing; the Bonus Action heal is the parsed activity.
 */
export default class Tranquility extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Tranquility",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
      },
    ];
  }

}
