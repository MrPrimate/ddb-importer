import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dream: the willing messenger enters a trance for the duration, Incapacitated with a speed of 0.
 */
export default class Dream extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Trance State",
        statuses: ["Incapacitated"],
        // a Speed of 0 covers every movement mode, not only walking
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          ...["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
            DDBEnricherData.ChangeHelper.overrideChange("0", 60, `system.attributes.movement.${mode}`)),
        ],
        options: {
          description: "While in the trance the messenger is Incapacitated and has a Speed of 0; the trance ends early if the messenger chooses.",
        },
      },
    ];
  }

}
