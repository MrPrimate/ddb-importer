/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class EnsnaringStrike extends DDBEnricherData {
  get type() {
    return this.is2014 && DDBEnricherData.AutoEffects.effectModules().midiQolInstalled ? "utility" : "none";
  }

  get activity() {
    return {
      name: "Cast (Automation)",
    };
  }

  get clearAutoEffects() {
    return true;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Restrained",
          type: "save",
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          noSpellslot: DDBEnricherData.AutoEffects.effectModules().midiQolInstalled,
        },
      },
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["piercing"],
              scalingMode: "whole",
              scalingNumber: "1",
            }),
          ],
          noeffect: true,
        },
        overrides: {
          noTemplate: true,
          activationType: "special",
          activationCondition: "Start of Targets Turn",
        },
      },
    ];
  }

  get effects() {
    const automationEffects = this.is2014
      ? [
        {
          name: `${this.data.name} (Automation)`,
          activityMatch: "Cast (Automation)",
          midiOnly: true,
          onUseMacroChanges: [
            { macroPass: "postActiveEffects", macroType: "spell", macroName: "ensnaringStrike.js", document: this.data },
          ],
          data: {
            flags: {
              dae: {
                specialDuration: [],
                selfTargetAlways: true,
                selfTarget: true,
              },
            },
          },
        },
      ]
      : [];
    return [
      {
        name: `${this.data.name}: Restrained`,
        statuses: ["Restrained"],
        activityMatch: "Save vs Restrained",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `turn=start,damageRoll=(@spellLevel)d6,damageType=piercing,label=${this.data.name}: Entangled,actionSave=roll,rollType=check,saveAbility=str,saveDC=@attributes.spelldc,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      ...automationEffects,
    ];
  }

  get itemMacro() {
    if (!this.is2014) return null;
    return {
      type: "spell",
      name: "ensnaringStrike.js",
    };
  }
}
