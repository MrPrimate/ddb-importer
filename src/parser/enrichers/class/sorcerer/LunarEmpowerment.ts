import DDBEnricherData from "../../data/DDBEnricherData";

export default class LunarEmpowerment extends DDBEnricherData {

  get activity(): IDDBActivityData {
    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        name: "Full Moon: Shed Light",
        activationType: "special",
      };
    } else {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
        data: {
          name: "Full Moon: Shed Light",
          macro: {
            name: "Apply Light",
            function: "ddb.generic.light",
            visible: false,
            parameters: `{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":20,"bright":10},"flag":"light"}`,
          },
        },
      };
    }
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Full Moon",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
      {
        init: {
          name: "New Moon",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
      {
        init: {
          name: "Crescent Moon",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        name: "Full Moon Aura",
        activitiesMatch: ["Full Moon"],
        changes: [
          DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.inv.roll.mode"),
          DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.per.roll.mode"),
        ],
        daeStackable: "noneNameOnly",
        data: {
          flags: {
            ActiveAuras: {
              ignoreSelf: false,
              aura: "Allies",
              radius: `10`,
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
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
          distanceFormula: `10`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
      {
        name: "New Moon",
        activityMatch: "New Moon",
        changes: [
          DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.ste.roll.mode"),
        ],
      },
      {
        name: "Crescent Moon",
        activityMatch: "Crescent Moon",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
        ],
      },
    ];
    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      effects.push({
        name: "Full Moon: Shed Light",
        activityMatch: "Full Moon: Shed Light",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "override", "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "override", "10"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "override", "#ffffff"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "override", "0.25"),
        ],
      } as IDDBEffectHint);
    }
    return effects;
  }

}
