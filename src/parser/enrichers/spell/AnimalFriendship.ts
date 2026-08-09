import DDBEnricherData from "../data/DDBEnricherData";

export default class AnimalFriendship extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["Charmed"],
      },
    ];
  }

}
