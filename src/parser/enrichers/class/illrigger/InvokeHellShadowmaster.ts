import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The Shadowmaster's two Invoke Hell options. Both spend the shared Invoke Hell use; Master of
 * Disguise is the Disguise Self spell DDB grants alongside. DDB's No Escape action carries no
 * save, so it is built here.
 */
export default class InvokeHellShadowmaster extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Invoke Hell: Master of Disguise", type: "class", rename: ["Master of Disguise"] },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          activationType: "action",
          activationCondition: "Cast Disguise Self without expending a spell slot",
          targetType: "self",
        },
      },
      {
        init: {
          name: "No Escape",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          generateDuration: true,
          generateSave: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "The save is made with disadvantage if the target is in dim light or darkness",
          },
          // the hold has no fixed duration, it ends on distance or the illrigger dropping
          durationOverride: {
            units: "spec",
            value: "",
          },
          saveOverride: {
            ability: ["cha"],
            dc: _Illrigger.INTERDICT_DC,
          },
        },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          targetType: "creature",
          targetCount: 1,
          rangeType: "ft",
          rangeValue: 30,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "No Escape",
        activityMatch: "No Escape",
        options: {
          description: "Your speed is halved and you can't willingly move more than 30 feet away from the illrigger. Ends if the illrigger is incapacitated or dies, or you are more than 30 feet away.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
