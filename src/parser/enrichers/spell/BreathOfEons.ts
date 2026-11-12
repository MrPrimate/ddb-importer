import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Evoker): spectral wings give a 60 ft Fly Speed with hover while concentrating.
 */
export default class BreathOfEons extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Breath of Eons",
        options: {
          durationSeconds: 60,
          description: "Moving within 5 feet of a creature can curse it: the next damage it takes gains 1d10 Force.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
        ],
      },
    ];
  }

}
