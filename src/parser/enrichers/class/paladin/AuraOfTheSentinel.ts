import DDBEnricherData from "../../data/DDBEnricherData";

export default class AuraOfTheSentinel extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "ally",
      activationType: "special",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.watchers.aura-of-the-sentinel",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: this.data.name,
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        standalone: true,
        originReplacement: true,
        auraeffectsNever: true,
        name: this.data.name,
      },
      {
        options: {
          transfer: true,
        },
        noCreate: true,
        auraeffectsOnly: true,
        daeStackable: "noneNameOnly",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `@scale.watchers.aura-of-the-sentinel`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];

  }
}
