import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityTwilightSanctuary extends DDBEnricherData {

  get type() {
    return this.isAction
      ? DDBEnricherData.ACTIVITY_TYPES.NONE
      : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    // const template = DDBEnricherData.AutoEffects.effectModules().atlInstalled
    //   ? {
    //     count: "",
    //     type: "",
    //     size: "",
    //     width: "",
    //     height: "",
    //     units: "ft",
    //   }
    //   : {
    //     size: "30",
    //     units: "ft",
    //     type: "radius",
    //   };
    return {
      name: "Activate",
      id: "activateEyesOfNi",
      addItemConsume: true,
      targetType: "self",
      rangeSelf: true,
      data: {
        target: {
          template: {
            count: "",
            type: "",
            size: "",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    };
  }


  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "turnStart",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 6,
            bonus: "@classes.cleric.levels",
            type: "tempHP",
          }),
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    const changes = [
      DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.dim"),
      DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "token.light.color"),
      DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
      DDBEnricherData.ChangeHelper.overrideChange("4", 20, "token.light.animation.intensity"),
      DDBEnricherData.ChangeHelper.overrideChange("sunburst", 20, "token.light.animation.type"),
      DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
    ];

    return [
      {
        name: "Twilight Emanation",
        activityMatch: "Activate",
        options: {
          durationSeconds: 60,
        },
        changes,
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Temp HP"],
    };
  }
}
