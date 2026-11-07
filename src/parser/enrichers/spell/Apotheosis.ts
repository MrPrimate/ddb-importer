import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Priest): an angelic form with a 90 ft Fly Speed and resistance to four damage types for 1 minute.
 */
export default class Apotheosis extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Apotheosis",
        options: {
          durationSeconds: 60,
          description: "Healing or Radiant spells cast with a slot resolve as if the slot were 2 levels higher (maximum 9).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("90", 20, "system.attributes.movement.speeds.fly"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
      },
    ];
  }

}
