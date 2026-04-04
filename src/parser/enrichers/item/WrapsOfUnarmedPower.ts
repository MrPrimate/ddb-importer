import DDBEnricherData from "../data/DDBEnricherData";

export default class WrapsOfUnarmedPower extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        restrictions: {
          type: "weapon",
          restriction: "unarmed",
          allowMagical: true,
        },
      },
    };
  }

  bonus() {
    const nameRegex = /Wraps of Unarmed Power, \+(\d)/;
    const match = this.name.match(nameRegex);
    if (match) {
      return parseInt(match[1]);
    }
    return 1;
  }

  get effects(): IDDBEffectHint[] {
    const bonus = this.bonus();
    return [
      {
        type: "enchant",
        name: `Wraps +${bonus}`,
        noCreate: true,
        magicalBonus: {
          makeMagical: true,
          bonus: bonus,
          nameAddition: `+${bonus}`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("force", 20, "system.damage.base.types"),
        ],
        options: {
          description: `This unarmed attack has become a +${bonus} magic weapon, granting a bonus to attack and damage rolls.`,
        },
      },
    ];
  }

}
