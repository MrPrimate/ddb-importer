/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBActivityData} DDBActivityData */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBAdditionalActivity} DDBAdditionalActivity */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBEffectHint} DDBEffectHint */
/** @typedef {import('../../data/DDBEnricherData.mjs').DDBOverrideData} DDBOverrideData */

import { DDBEnricherData } from '../../data/_module.mjs';


export default class AspectOfTheWyrm extends DDBEnricherData {

  get type() {
    return "utility";
  }

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
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

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  get additionalActivities() {
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
        constructor: {
          name: `Spend ${spend} to Restore Use`,
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noEffects: true,
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
                target: spend,
                scaling: { allowed: false, max: "" },
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
  get effects() {
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

  get override() {
    return {
      replaceActivityUses: true,
    //     data: {
    //       "flags.ddbimporter.skipScale": true,
    //     },
    };
  }
}
