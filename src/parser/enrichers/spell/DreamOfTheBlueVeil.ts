import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dream of the Blue Veil: the travellers fall Unconscious for the six hours of the journey.
 */
export default class DreamOfTheBlueVeil extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dreaming",
        statuses: ["Unconscious", "Incapacitated"],
        options: {
          durationSeconds: 21600,
        },
      },
    ];
  }

}
