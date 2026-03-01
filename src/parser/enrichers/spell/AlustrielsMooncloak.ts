import DDBEnricherData from "../data/DDBEnricherData";

export default class AlustrielsMooncloak extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Cast",
    };
  }

  get addAutoAdditionalActivities() {
    return false;
  }

  get additionalActivities() {
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

  get effects() {
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
