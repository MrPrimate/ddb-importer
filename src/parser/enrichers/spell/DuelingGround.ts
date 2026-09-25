import DDBEnricherData from "../data/DDBEnricherData";

/** AU 2024. The two designated duellists carry a mark for the hour; the ward itself is manual. */
export default class DuelingGround extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dueling Ground Target",
        statuses: ["Marked"],
        options: {
          description: "Designated target of Dueling Ground. At 0 HP the target is Stable and teleports out of the circle; the spell ends early if any other creature enters it.",
        },
      },
    ];
  }

}
