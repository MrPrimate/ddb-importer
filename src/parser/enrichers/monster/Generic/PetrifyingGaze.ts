import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Progressive petrification gazes (Basilisk, Medusa, Euryale, Hierophant
 * Medusa, 2014 and 2024 wordings): a failed save restrains the target, a
 * further failed repeat save petrifies it. The auto condition parser can only
 * surface one of the two conditions, so replace it with both effects for the
 * save activity.
 */
export default class PetrifyingGaze extends DDBEnricherData {

  get clearAutoEffects(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained (First Failure)",
        options: {
          description: "The target is Restrained as it begins to turn to stone. It repeats the saving throw at the end of its next turn, ending the effect on a success or becoming Petrified on a failure.",
        },
        statuses: ["Restrained"],
      },
      {
        name: "Petrified (Second Failure)",
        options: {
          description: "The target is Petrified until freed by the Greater Restoration spell or other magic.",
        },
        statuses: ["Petrified"],
      },
    ];
  }

}
