import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Half Cover for the paladin and allies inside the Aura of Protection until the start of the
 * paladin's next turn, triggered by casting Divine Smite. Without auraeffects the activity places
 * a template whose region applies the standalone effect.
 */
export default class SmiteOfProtection extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Smite of Protection",
      activationType: "special",
      activationCondition: "When you cast Divine Smite",
      targetType: "ally",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: `@scale.${this.classIdentifier("Paladin")}.aura-of-protection`,
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Smite of Protection",
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Smite of Protection",
        standalone: true,
        auraeffectsNever: true,
        statuses: ["coverHalf"],
        options: {
          expiry: "sourceStart",
        },
      },
      {
        name: "Smite of Protection",
        activityMatch: "Smite of Protection",
        auraeffectsOnly: true,
        statuses: ["coverHalf"],
        options: {
          expiry: "sourceStart",
        },
        daeStackable: "noneNameOnly",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `@scale.${this.classIdentifier("Paladin")}.aura-of-protection`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
