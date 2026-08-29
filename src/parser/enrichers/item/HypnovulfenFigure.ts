import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

/**
 * "Hypnovulfen Bite. You can bite as an Unarmed Strike that deals 1d6 Piercing damage instead of
 * Bludgeoning damage." That replaces the strike's die and damage type rather than adding to it,
 * so it is an enchantment on the unarmed strike. The figure's spell attack and save DC bonuses
 * are restriction-gated by DDB and left to the parser.
 */
export default class HypnovulfenFigure extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hypnovulfen Bite",
      noConsumeTargets: true,
      data: {
        _id: utils.namedIDStub("hypnovulfenFigure", { postfix: "core" }),
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
        type: "enchant",
        name: "Hypnovulfen Bite",
        activityMatch: "Hypnovulfen Bite",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Hypnovulfen Bite]`, 25, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
          DDBEnricherData.ChangeHelper.overrideChange("6", 20, "system.damage.base.denomination"),
          DDBEnricherData.ChangeHelper.addChange("piercing", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("-bludgeoning", 21, "system.damage.base.types"),
        ],
        options: {
          description: "Your teeth become viciously sharp. You can bite as an Unarmed Strike that deals 1d6 Piercing damage instead of Bludgeoning damage.",
        },
        data: {
          _id: utils.namedIDStub("hypnovulfBite", { prefix: "enchant", postfix: "ef" }),
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
          effectId: utils.namedIDStub("hypnovulfBite", { prefix: "enchant", postfix: "ef" }),
          activityId: utils.namedIDStub("hypnovulfenFigure", { postfix: "core" }),
        },
      };

    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbFigure">
<p><strong>Implementation Details</strong></p>
<p>The uses valued of Cursed Hunger tracks your current DC.</p>
</section>`,
      data: {
        flags: {
          ddbimporter: flags,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cursed Hunger",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
        },
        overrides: {
          activationType: "encounter",
          addActivityConsume: true,
          activityConsumeValue: "-2",
          rangeSelf: true,
          data: {
            "img": "icons/creatures/mammals/wolf-shadow-black.webp",
            "description": {
              "chatFlavor": "The Uses Count represents the current DC.",
            },
            "duration": {
              "units": "inst",
            },
            "uses": {
              "spent": 99, // TO DO - the uses should be retained
              "recovery": [],
              "max": "99",
            },
            "save": {
              "dc": {
                "calculation": "",
                "formula": "",
              },
              "visible": true,
              ability: ["wis"],
              "bonus": "",
            },
          },
        },
      },
    ];
  }

}
