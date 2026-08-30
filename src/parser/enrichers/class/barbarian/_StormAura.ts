import DDBEnricherData from "../../data/DDBEnricherData";

export default abstract class _StormAura extends DDBEnricherData {

  abstract get element(): string;

  abstract get tundra(): string;

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Activate Aura",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "While raging",
          },
          targetOverride: {
            override: true,
            affects: {
              type: "ally",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "10",
              units: "ft",
            },
          },
        },
        overrides: {
          data: {
            sort: 0,
            visibility: {
              identifier: "barbarian",
            },
            duration: this.is2014
              ? { units: "minute", value: "1" }
              : { units: "minute", value: "10" },
            behaviors: [
              DDBEnricherData.BehaviorHelper.applyEffect({
                effects: `Shielding Storm: ${this.tundra}`,
                level: { min: 10 },
                auraeffectsNever: true,
              }),
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: `Shielding Storm: ${this.tundra}`,
        standalone: true,
        auraeffectsNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(this.element),
        ],
        options: {
          durationSeconds: this.is2014 ? 60 : 600,
        },
      },
    ];
  }

}
