import DDBEnricherData from "../../data/DDBEnricherData";

export default class DraconicStrike extends DDBEnricherData {
  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.die + max(@ability.mod.str, @ability.mod.dex)",
              types: ["acid", "cold", "fire", "lightning", "poison"],
            }),
          ],
        },
      },
    };
  }


  get effects() {
    return [
      {
        name: "Draconic Strike",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("fin", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.damage.base.custom.enabled"),
          DDBEnricherData.ChangeHelper.overrideChange("@scale.monk.die.die + @mod", 20, "system.damage.base.custom.formula"),
          DDBEnricherData.ChangeHelper.addChange("acid", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("cold", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("fire", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("lightning", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("poison", 20, "system.damage.base.types"),
        ],
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Draconic Strike: Simple Weapons",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
              categories: ['simpleM'],
            },
          },
        },
      },
      {
        init: {
          name: "Draconic Strike: Light Martial Weapons",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
              categories: ['martialM'],
              properties: ['lgt'],
            },
          },
        },
      },
    ];
  }
}
