import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Stop Sign (OTFY): a failed Wisdom save leaves the target unable to move toward the sign until it
 * vanishes at the start of the caster's next turn. Direction-bound movement has no system field, so
 * the effect is a marker.
 */
export default class StopSign extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stop Sign: Can't Move Toward the Sign",
        options: {
          expiry: "sourceStart",
          description: "The target can't move toward the stop sign until the start of the caster's next turn.",
        },
      },
    ];
  }

}
