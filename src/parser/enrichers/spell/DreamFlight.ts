import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Evoker): spectral wings give a 60 ft Fly Speed with hover while concentrating.
 */
export default class DreamFlight extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dream Flight",
        options: {
          durationSeconds: 60,
          description: "Moving within 5 feet of a creature can restore 5d4 Hit Points to it, once per turn per creature.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.movement.speeds.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
        ],
      },
    ];
  }

}
