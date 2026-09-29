import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The Shadowmaster's two Invoke Hell options. Both spend the shared Invoke Hell use. Master of
 * Disguise is a cast of Disguise Self, so the spell grant builder finds the cast by its spell and
 * does not add a second one with uses of its own. DDB's No Escape action carries no save, so it is
 * built here.
 */
export default class InvokeHellShadowmaster extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Master of Disguise",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateSpell: true,
        },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          addSpellUuid: "Disguise Self",
          noSpellslot: true,
          activationType: "action",
          data: {
            spell: {
              spellbook: true,
            },
          },
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
          DDBEnricherData.ChangeHelper.movementMultiplierChange(0.5),
        ],
      },
    ];
  }

}
