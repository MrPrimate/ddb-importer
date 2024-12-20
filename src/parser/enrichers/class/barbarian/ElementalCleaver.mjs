/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalCleaver extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
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
      { type: "acid", img: "icons/magic/acid/dissolve-bone-white.webp" },
      { type: "cold", img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
      { type: "fire", img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
      { type: "lightning", img: "icons/magic/lightning/bolt-strike-blue.webp" },
      { type: "thunder", img: "icons/magic/sonic/explosion-shock-wave-teal.webp" },
    ].map((element) => {
      return [
        { bonus: "1", min: null, max: 13 },
        { bonus: "2", min: 14, max: null },
      ].map((data) => {
        return {
          type: "enchant",
          name: `Elemental Cleaver: ${utils.capitalize(element.type)} +${data.bonus}d6`,
          options: {
            description: `This weapon is infused with elemental energy.`,
          },
          data: {
            img: element.img,
            "flags.ddbimporter.effectIdLevel": {
              min: data.min,
              max: data.max,
            },
          },
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange(`{} [Elemental Cleaver]`, 20, "name"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("thr", 20, "system.properties"),
            DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "system.range.value"),
            DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.range.long"),
            DDBEnricherData.ChangeHelper.overrideChange("ft", 20, "system.range.units"),
            DDBEnricherData.ChangeHelper.unsignedAddChange(`[["${data.bonus}d4[${element.type}]", "${element.type}"]]`, 20, "system.damage.parts"),
          ],
        };
      });
    }).flat();
  }

}
