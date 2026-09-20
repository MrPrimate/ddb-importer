import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Compulsion: a creature that fails the save is Charmed for the duration and must move in the designated direction on its turns.
 */
export default class Compulsion extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Compelled",
        statuses: ["Charmed"],
        options: {
          description: "Charmed; at the start of each of its turns it uses all its movement to move in the direction you designate.",
        },
      },
    ];
  }

}
