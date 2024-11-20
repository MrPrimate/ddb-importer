/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ShadowBlade extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        name: "Cast",
        targetType: "self",
      },
    };
  }

  // get additionalActivities() {
  //   return [
  //     {
  //       constructor: {
  //         name: "Shadow Blade Attack",
  //         type: "attack",
  //       },
  //       build: {
  //         generateAttack: true,
  //         generateDamage: true,
  //         generateConsumption: false,
  //         noSpellslot: true,
  //         noeffect: true,
  //         damageParts: [
  //           DDBEnricherData.basicDamagePart({
  //             number: 2,
  //             denomination: 8,
  //             types: ["psychic"],
  //             scalingFormula: "half",
  //             scalingNumber: 1,
  //           }),
  //         ],
  //         attackOverride: {
  //         },
  //       },
  //     },
  //   ];
  // }

  get effects() {
    return [
      {
        name: "Wielding Shadow Blade",
      },
    ];
  }
}
