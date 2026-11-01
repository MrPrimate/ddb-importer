import Generic from "./Generic";

/**
 * Feline Instincts (OTFY): Uncanny Senses adds half the Proficiency Bonus (round down) to Perception
 * checks. The Prone save advantage comes from DDB's modifiers.
 */
export default class FelineInstincts extends Generic {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Uncanny Senses",
        options: {
          transfer: true,
        },
        changes: [
          Generic.ChangeHelper.unsignedAddChange("floor(@prof / 2)", 20, "system.skills.prc.roll.bonus"),
        ],
      },
    ];
  }

}
