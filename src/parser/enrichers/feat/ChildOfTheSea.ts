import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Child of the Sea (World of Warcraft, Human origin feat): Ocean Born gives a Swim Speed equal to
 * the character's Speed. Lasting Breath (2 + Con mod minutes) stays description.
 */
export default class ChildOfTheSea extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ocean Born",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.swim"),
        ],
      },
    ];
  }

}
