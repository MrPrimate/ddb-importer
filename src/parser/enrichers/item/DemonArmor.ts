import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class DemonArmor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Clawed Gauntlets",
      data: {
        _id: utils.namedIDStub("demonArmr", { postfix: "core" }),
        restrictions: {
          type: "weapon",
          categories: ["natural"],
          allowMagical: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // the item's own AC effect is already named after the item
        name: "Demon Padded Armor: Unarmed Strikes",
        options: {
          transfer: true,
          description: "+1 bonus to the attack and damage rolls of your Unarmed Strikes.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("attack", "1", {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "1", {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
        ],
      },
      {
        type: "enchant",
        name: "Clawed Gauntlets",
        activityMatch: "Clawed Gauntlets",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
          DDBEnricherData.ChangeHelper.overrideChange("8", 20, "system.damage.base.denomination"),
          DDBEnricherData.ChangeHelper.overrideChange("false", 20, "system.damage.base.custom.enabled"),
          // a Set change removes an entry when the value is prefixed with "-"
          DDBEnricherData.ChangeHelper.addChange("slashing", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("-bludgeoning", 21, "system.damage.base.types"),
        ],
        options: {
          description: "Your Unarmed Strikes deal 1d8 Slashing damage instead of the usual Bludgeoning damage.",
        },
        data: {
          _id: utils.namedIDStub("demonArmr", { prefix: "enchant", postfix: "ef" }),
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const flags: IDDBImporterFlags = this.ddbParser.isMuncher
      ? {}
      : {
        transferEnchantment: {
          targetItemMatches: [
            { field: "type", value: "weapon" },
            { field: "system.type.value", value: "natural" },
          ],
          effectId: utils.namedIDStub("demonArmr", { prefix: "enchant", postfix: "ef" }),
          activityId: utils.namedIDStub("demonArmr", { postfix: "core" }),
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
