/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Shillelagh extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get effects() {
    const name = this.data.name.split("(")[0];
    if (this.is2014) {
      const changes = [
        DDBEnricherData.ChangeHelper.overrideChange(`{} [${name}]`, 20, "name"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.properties"),
        DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
        DDBEnricherData.ChangeHelper.overrideChange("8", 20, "system.damage.base.denomination"),
        DDBEnricherData.ChangeHelper.overrideChange("0", 50, "system.damage.base.custom.enabled"),
        DDBEnricherData.ChangeHelper.overrideChange("none", 50, "activities[attack].attack.ability"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`max(@abilities.str.mod, @attributes.spell.mod)`, 50, "activities[attack].attack.bonus"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`max(@abilities.str.mod, @attributes.spell.mod)`, 50, "system.damage.base.bonus"),
      ];

      return [{
        name: `${name}`,
        type: "enchant",
        changes,
      }];
    } else {
      return [
        { level: 1, denomination: 8, min: null, max: 4 },
        { level: 5, denomination: 10, min: 5, max: 10 },
        { level: 11, denomination: 12, min: 11, max: 16 },
        { level: 17, number: 2, denomination: 6, min: 17, max: null },
      ].map((data) => {
        const changes = [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [${name}]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.overrideChange(`${data.number ?? 1}`, 20, "system.damage.base.number"),
          DDBEnricherData.ChangeHelper.overrideChange(`${data.denomination}`, 50, "system.damage.base.denomination"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("force", 50, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 50, "system.damage.base.custom.enabled"),
          DDBEnricherData.ChangeHelper.overrideChange("none", 50, "activities[attack].attack.ability"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`max(@abilities.str.mod, @attributes.spell.mod)`, 50, "activities[attack].attack.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`max(@abilities.str.mod, @attributes.spell.mod)`, 50, "system.damage.base.bonus"),
        ];
        return {
          name: `${name} (${data.number ?? 1}d${data.denomination})`,
          type: "enchant",
          changes,
          data: {
            "flags.ddbimporter.effectIdLevel": {
              min: data.min,
              max: data.max,
            },
          },
        };
      });
    }

  }


}
