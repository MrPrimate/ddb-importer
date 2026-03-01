import DDBEnricherData from "../../data/DDBEnricherData";

export default class MoteOfPotential extends DDBEnricherData {

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.NONE : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
    return {
      name: "Attack Save vs Mote of Potential",
      noConsumeTargets: true,
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scaling",
              types: ["thunder"],
            }),
          ],
        },
        range: {
          units: "spec",
        },
        consumption: {
          scaling: {
            allowed: true,
            max: "@scale.bard.inspiration.faces",
          },
        },
        target: {
          affects: {
            count: "",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Temp HP from Mote of Potential Save",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: false,
          generateHealing: true,
          consumptionOverride: {
            scaling: {
              allowed: true,
              max: "@scale.bard.inspiration.faces",
            },
          },
        },
        overrides: {
          noTemplate: true,
          activationType: "special",
          noConsumeTargets: true,
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@scaling + max(1, @abilities.cha.mod)",
              types: ["temphp"],
            }),
          },
        },
      },
    ];
  }

}
