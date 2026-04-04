import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class WrapsOfUnarmedPower extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        _id: utils.namedIDStub("wrapsOfUnarmedPower", { postfix: "core" }),
        restrictions: {
          type: "weapon",
          restriction: "unarmed",
          allowMagical: true,
        },
      },
    };
  }

  get bonus() {
    const nameRegex = /Wraps of Unarmed Power, \+(\d)/;
    const match = this.name.match(nameRegex);
    if (match) {
      return parseInt(match[1]);
    }
    return 1;
  }

  get effects(): IDDBEffectHint[] {
    const bonus = this.bonus;
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
        data: {
          _id: utils.namedIDStub(`wrapsOUPow${bonus}`, { prefix: "enchant", postfix: "ef" }),
        },
      },
    ];
  }

  get override(): IDDBOverrideData {

    const flags: IDDBImporterFlags = this.ddbParser.isMuncher
      ? {}
      : {
        transferEnchantment: {
          targetItemMatches: [
            { field: "type", value: "weapon" },
            { field: "system.type.value", value: "natural" },
          ],
          effectId: utils.namedIDStub(`wrapsOUPow${this.bonus}`, { prefix: "enchant", postfix: "ef" }),
          activityId: utils.namedIDStub("wrapsOfUnarmedPower", { postfix: "core" }),
        },
      };

    return {
      data: {
        flags: {
          ddbimporter: flags,
        },
      },
    };
  }

}
