import DDBEnricherData from "../data/DDBEnricherData";

export default class ShadowBlade extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        name: "Cast",
        targetType: "self",
      },
    };
  }

  // get additionalActivities(): IDDBAdditionalActivity[] {
  //   return [
  //     {
  //       init: {
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
  //             customFormula: "(1 + min(4, (ceil((@item.level) / 2))))d8",
  //             types: ["psychic"],
  //           }),
  //         ],
  //       },
  //       overrides: {
  //         data: {
  //           attack: {
  //             type: {
  //               "value": "melee",
  //               "classification": "weapon",
  //             },
  //           },
  //           duration: {
  //             "units": "inst",
  //             "override": true,
  //           },
  //           range: {
  //             "units": "ft",
  //             "override": true,
  //             "value": "5",
  //           },
  //           target: {
  //             "template": {
  //               "units": "ft",
  //               "type": "",
  //             },
  //             "affects": {
  //               "count": "1",
  //               "type": "creature",
  //               "special": "",
  //             },
  //             "override": true,
  //           },
  //           activation: {
  //             "type": "action",
  //             "override": true,
  //           },
  //         },
  //       },
  //     },
  //   ];
  // }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wielding Shadow Blade",
      },
    ];
  }
}
