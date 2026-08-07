import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * College of Fleshweaving. A 10 minute ritual grants one of six hour-long
 * bodily reskins; two of them carry their own follow-up activity.
 */
export default class RitualReskin extends DDBEnricherData {

  static HOUR = 3600;

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Perform Ritual",
      addItemConsume: true,
      activationType: "minute",
      activationValue: 10,
      targetType: "self",
      data: {
        duration: {
          value: "1",
          units: "hour",
          override: true,
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cactus Skin: End of Turn",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateDamage: true,
          noeffect: true,
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature ends its turn grappling you or grappled by you",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration",
              types: ["piercing"],
            }),
          ],
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
      {
        init: {
          name: "Rhino's Hide: Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateActivation: true,
          noeffect: true,
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@scale.bard.inspiration",
            types: ["temphp"],
          }),
          activationOverride: {
            type: "special",
            value: null,
            condition: "",
          },
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "self",
        },
      },
      {
        init: {
          name: "Regain Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "3",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    const options = { durationSeconds: RitualReskin.HOUR };
    const advantage = `${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`;

    return [
      {
        name: "Bull's Buns",
        activityMatch: "Perform Ritual",
        options,
        changes: [
          DDBEnricherData.ChangeHelper.addChange(advantage, 20, "system.abilities.str.check.roll.mode"),
        ],
      },
      {
        name: "Cactus Skin",
        activityMatch: "Perform Ritual",
        options,
      },
      {
        name: "Cat's Paws",
        activityMatch: "Perform Ritual",
        options,
        changes: [
          DDBEnricherData.ChangeHelper.addChange(advantage, 20, "system.abilities.dex.check.roll.mode"),
        ],
      },
      {
        name: "Fish Form",
        activityMatch: "Perform Ritual",
        options,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("@attributes.movement.walk", 50, "system.attributes.movement.swim"),
        ],
      },
      {
        name: "Rhino's Hide",
        activityMatch: "Perform Ritual",
        options,
        changes: [
          DDBEnricherData.ChangeHelper.addChange(advantage, 20, "system.abilities.con.check.roll.mode"),
        ],
      },
      {
        name: "Owl's Sight",
        activityMatch: "Perform Ritual",
        options,
        changes: [
          DDBEnricherData.ChangeHelper.addChange(advantage, 20, "system.abilities.wis.check.roll.mode"),
          DDBEnricherData.ChangeHelper.addChange(advantage, 20, "system.attributes.init.roll.mode"),
        ],
      },
    ];
  }

}
