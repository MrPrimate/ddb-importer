import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Bait (OTFY): each creature that fails the Wisdom save is either baited or dragged, the caster's
 * choice per creature. One marker effect for each outcome; both last until the creature's next turn
 * ends (the attack reduction applies to that turn's Attack action).
 */
export default class Bait extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        midiProperties: { chooseEffects: true },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bait: Baited",
        options: {
          expiry: "targetEnd",
          description: "If the creature takes the Attack action on its next turn, it makes one fewer attack (to a minimum of no attacks).",
        },
      },
      {
        name: "Bait: Dragged",
        options: {
          expiry: "targetEnd",
          description: "The creature moves with the lure for the rest of its movement (provoking Opportunity Attacks). At the start of its next turn its Speed is reduced by the distance it was moved.",
        },
      },
    ];
  }

}
