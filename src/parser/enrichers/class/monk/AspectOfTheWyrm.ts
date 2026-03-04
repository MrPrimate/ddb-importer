import { DDBEnricherData } from "../../data/_module";


export default class AspectOfTheWyrm extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Resistance",
      noConsumeTargets: true,
      addItemConsume: true,
      activationType: "bonus",
      targetType: "creature",
      data: {
        midiProperties: { chooseEffects: true },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    const spend = this.is2014 ? "Ki" : "Monk's Focus";
    return [
      {
        action: {
          name: "Aspect of the Wyrm: Frightful Presence",
          type: "class",
          rename: ["Frightful Presence"],
        },
        overrides: {
          noConsumeTargets: true,
          addItemConsume: true,
        },
      },
      {
        init: {
          name: `Spend ${spend} to Restore Use`,
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
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "3",
                target: spend,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects(): IDDBEffectHint[] {
    const resistanceEffects = ["Acid", "Cold", "Fire", "Lightning", "Poison"].map((damageType) => ({
      name: `Aspect of the Wyrm: Resistance (${damageType})`,
      activityMatch: "Resistance",
      changes: [
        DDBEnricherData.ChangeHelper.damageResistanceChange(damageType),
      ],
      options: {
        durationSeconds: 600,
      },
    }));

    const featEffect = [
      {
        name: "Aspect of the Wyrm: Frightful Presence",
        activitiesMatch: ["Aspect of the Wyrm: Frightful Presence", "Frightful Presence"],
        statuses: ["frightened"],
        options: {
          durationSeconds: 60,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `turn=end, savingThrow=true, saveAbility=wis, saveDC=@attributes.spell.dc, label=Frightened by ${this.data.name}`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
    return [...resistanceEffects, ...featEffect];
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }
}
