import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Spirit Caller: a bonus action raises a 10-foot aura on the sorcerer or a
 * willing ally (drop the emanation on that token).
 *
 * "Spirit Aura" places it andnthe region fires Maddening Whispers (enemies: Wis save or disadvantage on
 * checks and attacks) or Bolstering Whispers (allies: advantage, no save) when
 * a creature enters or starts its turn inside - each behavior takes the
 * disposition of the activity it fires, so the aura can carry both.
 */
export default class SpiritAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spirit Aura",
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityName: "Maddening Whispers",
          }),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityName: "Bolstering Whispers",
          }),
        ],
        range: {
          units: "self",
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            type: "radius",
            size: "10",
            units: "ft",
            count: "1",
            contiguous: false,
            width: "",
            height: "",
          },
        },
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Maddening Whispers",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          saveOverride: {
            ability: ["wis"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          activationOverride: {
            type: "special",
            condition: "An enemy enters the aura or starts its turn there",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "enemy",
            },
            template: {},
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "spec",
            },
          },
        },
      },
      {
        init: {
          name: "Bolstering Whispers",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "An ally enters the aura or starts its turn there",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "ally",
            },
            template: {},
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "spec",
            },
          },
        },
      },
      {
        init: {
          name: "Spend Sorcery Points to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
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
                type: "itemUses",
                value: "3",
                target: "feat:sorcery-points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Maddening Whispers",
        activityMatch: "Maddening Whispers",
        options: {
          expiry: "targetEnd",
          description: "Disadvantage on ability checks and attack rolls until the end of its next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack"),
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("check"),
        ],
      },
      {
        name: "Bolstering Whispers",
        activityMatch: "Bolstering Whispers",
        options: {
          expiry: "targetEnd",
          description: "Advantage on ability checks and attack rolls until the end of its next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("check"),
        ],
      },
    ];
  }

}
