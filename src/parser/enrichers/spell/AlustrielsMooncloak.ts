import DDBEnricherData from "../data/DDBEnricherData";

export default class AlustrielsMooncloak extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Within Moonlight" }),
        ],
      },
    };
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Liberation",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          noeffect: true,
        },
        overrides: {
          activationType: "reaction",
          overrideActivation: true,
        },
      },
      {
        init: {
          name: "Respite",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateDamage: false,
          generateHealing: true,
          generateRange: true,
          noSpellslot: true,
          generateConsumption: true,
          healingPart: DDBEnricherData.basicDamagePart({
            number: 4,
            denomination: 10,
            bonus: "@mod",
            type: "healing",
          }),
        },
        overrides: {
          activationType: "action",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Within Moonlight",
        standalone: true,
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
        statuses: ["coverHalf"],
      },
    ];
  }


  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "ally",
            },
          },
        },
      },
    };
  }

}
