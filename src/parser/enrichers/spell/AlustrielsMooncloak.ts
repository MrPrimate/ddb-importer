import DDBEnricherData from "../data/DDBEnricherData";

export default class AlustrielsMooncloak extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
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
        activityMatch: "Cast",
        name: "Within Moonlight",
        options: {
          durationSeconds: 60,
          durationRounds: 10,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
        statuses: ["coverHalf"],
        data: {
          flags: {
            dae: {
              stackable: "noneNameOnly",
              selfTarget: true,
              selfTargetAlways: true,
            },
            ActiveAuras: {
              aura: "Allies",
              radius: "20",
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
              ignoreSelf: false,
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
          distanceFormula: `20`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
