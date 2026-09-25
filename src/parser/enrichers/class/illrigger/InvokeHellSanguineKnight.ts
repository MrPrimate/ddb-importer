import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The Sanguine Knight's two Invoke Hell options. Both spend the shared Invoke Hell use.
 * Embolden Allies is a pool split between targets, so the heal rolls the whole pool and the
 * split is made by hand.
 */
export default class InvokeHellSanguineKnight extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Embolden Allies",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          generateHealing: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "Divide the hit points between yourself and creatures within 30 feet",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: `5 * ${_Illrigger.ILLRIGGER_LEVEL}`,
            types: ["healing"],
          }),
        },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          targetType: "creature",
          rangeType: "ft",
          rangeValue: 30,
        },
      },
      {
        init: {
          name: "Vitalize",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          generateDuration: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "No action required",
          },
          durationOverride: {
            units: "minute",
            value: "1",
          },
        },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          targetType: "creature",
          rangeType: "ft",
          rangeValue: 30,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vitalized",
        activityMatch: "Vitalize",
        originReplacement: true,
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+@prof", 20, "system.rolls.ability.check.bonus"),
        ],
      },
    ];
  }

}
