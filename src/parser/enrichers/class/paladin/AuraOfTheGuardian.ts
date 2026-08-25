import DDBEnricherData from "../../data/DDBEnricherData";
import Generic from "../Generic";

export default class AuraOfTheGuardian extends Generic {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      activationType: "special",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.redemption.aura-of-the-guardian",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Aura of the Guardian",
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of the Guardian",
        standalone: true,
        auraeffectsNever: true,
        options: {
          description: "Within the Redemption paladin's Aura of the Guardian: when this creature takes damage, the paladin can use their reaction to magically take that damage instead.",
        },
      },
      {
        name: "Aura of the Guardian",
        auraeffectsOnly: true,
        daeStackable: "none",
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.redemption.aura-of-the-guardian",
          disposition: 0,
          evaluatePreApply: true,
          overrideName: "",
        },
        options: {
          transfer: true,
        },
      },
    ];
  }

}
