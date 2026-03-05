import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityTwilightSanctuary extends DDBEnricherData {

  get type() {
    return this.isAction
      ? DDBEnricherData.ACTIVITY_TYPES.NONE
      : DDBEnricherData.AutoEffects.effectModules().atlInstalled
        ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
        : DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
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
        macro: {
          name: "Apply Light",
          function: "ddb.generic.light",
          visible: false,
          parameters: `{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":30,"bright":0},"flag":"light"}`,
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
    const lightAnimation = "{\"type\": \"sunburst\", \"speed\": 2,\"intensity\": 4}";
    const atlChanges = [
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "30"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "#ffffff"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "0.25"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.UPGRADE, lightAnimation),
    ];

    return [
      {
        name: "Twilight Emanation",
        activityMatch: "Activate",
        options: {
          durationSeconds: 60,
        },
        atlChanges,
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Temp HP"],
    };
  }
}
