import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A form-mode transform with a single form: casting applies Disguised to the caster and "No Form"
 * drops it. The effect changes no token art because the look is the player's choice; a
 * `token.texture.src` override can be added to the effect by hand.
 */
export default class DisguiseSelf extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Disguise",
      data: {
        ...DDBEnricherData.formTransformData({ formless: true }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Disguise",
        // a form is cloned straight onto the caster, so the spell's hour has to sit on the effect
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
        statuses: ["Disguised"],
      },
    ];
  }

}
