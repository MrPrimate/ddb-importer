import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Astral Projection: the bodies left behind lie in suspended animation, Unconscious until the spell ends.
 */
export default class AstralProjection extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Suspended Animation",
        statuses: ["Unconscious"],
        options: {
          description: "The body is left behind in suspended animation: Unconscious, needing no food or air, and not aging.",
        },
      },
    ];
  }

}
