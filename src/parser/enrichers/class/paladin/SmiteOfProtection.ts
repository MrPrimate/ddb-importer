import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Half Cover for the paladin and allies inside the Aura of Protection until the start of the
 * paladin's next turn, triggered by casting Divine Smite.
 */
export default class SmiteOfProtection extends DDBEnricherData {

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
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
            size: "@scale.paladin.aura-of-protection",
            units: "ft",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Smite of Protection",
        activityMatch: "Smite of Protection",
        statuses: ["coverHalf"],
        options: {
          expiry: "sourceStart",
        },
        daeStackable: "noneNameOnly",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "@scale.paladin.aura-of-protection",
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
              statuses: ["coverHalf"],
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.paladin.aura-of-protection",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }
}
