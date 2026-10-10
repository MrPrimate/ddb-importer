import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. Creatures of the caster's choice within 5 feet of the animated Shield gain +2 AC
 * while they are not wielding a Shield; the effect is applied to them and moves with the Shield
 * only by reapplying it.
 */
export default class AnimateShield extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetChoice: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Animate Shield",
        options: {
          description: "+2 AC while within 5 feet of the animated Shield and not wielding a Shield.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
