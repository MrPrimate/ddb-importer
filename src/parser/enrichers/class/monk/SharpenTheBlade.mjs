/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SharpenTheBlade extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      addItemConsume: true,
      itemConsumeValue: "1",
      addScalingMode: "amount",
      addConsumptionScalingMax: "3",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    };
  }

  get effects() {
    return [
      { bonus: "1", min: null, max: 3 },
      { bonus: "2", min: 4, max: 5 },
      { bonus: "3", min: 6, max: null },
    ].map((data) => {
      return {
        type: "enchant",
        name: `Sharpen the Blade +${data.bonus}`,
        magicalBonus: {
          makeMagical: true,
          bonus: data.bonus,
          nameAddition: `+${data.bonus}`,
        },
        options: {
          durationSeconds: 60,
          description: `This weapon has become a +${data.bonus} magic weapon, granting a bonus to attack and damage rolls.`,
        },
      };
    });
  }

}
