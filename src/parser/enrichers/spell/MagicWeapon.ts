import DDBEnricherData from "../data/DDBEnricherData";

export default class MagicWeapon extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      { bonus: "1", min: null, max: 3 },
      { bonus: "2", min: 4, max: 5 },
      { bonus: "3", min: 6, max: null },
    ].map((data) => {
      return {
        type: "enchant",
        name: `Magic Weapon +${data.bonus}`,
        magicalBonus: {
          makeMagical: true,
          bonus: data.bonus,
          nameAddition: `+${data.bonus}`,
        },
        options: {
          description: `This weapon has become a +${data.bonus} magic weapon, granting a bonus to attack and damage rolls.`,
        },
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: data.min,
                max: data.max,
              },
            },
          },
        },
      } as IDDBEffectHint;
    });
  }

}
