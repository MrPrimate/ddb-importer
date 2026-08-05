import DDBEnricherData from "../../data/DDBEnricherData";

export default class HungryJaws extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Bite",
      targetType: "creature",
      activationType: "bonus",
      data: {
        attack: {
          ability: "str",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        damage: {
          includeBase: false,
          parts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "piercing", bonus: "@mod" }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Gain Temporary Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateHealing: true,
          activationOverride: { type: "special", condition: "On a hit with Hungry Jaws" },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "max(1, @abilities.con.mod)",
            types: ["temphp"],
          }),
        },
      },
    ];
  }

}
