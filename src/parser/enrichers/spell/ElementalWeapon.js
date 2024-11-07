/* eslint-disable class-methods-use-this */
import utils from "../../../lib/utils.js";
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ElementalWeapon extends DDBEnricherMixin {

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
        { bonus: "1", min: null, max: 3 },
        { bonus: "2", min: 5, max: 6 },
        { bonus: "3", min: 7, max: null },
      ].map((data) => {
        return {
          type: "enchant",
          name: `Elemental Weapon: ${utils.capitalize(element.type)} +${data.bonus}`,
          magicalBonus: {
            makeMagical: true,
            bonus: `+${data.bonus}`,
            nameAddition: `+${data.bonus}`,
          },
          options: {
            description: `This weapon has become a +${data.bonus} magic weapon, granting a bonus to attack and damage rolls. It also gains additional elemental damage.`,
          },
          data: {
            img: element.img,
            "flags.ddbimporter.effectIdLevel": {
              min: data.min,
              max: data.max,
            },
          },
          changes: [
            DDBEnricherMixin.generateUnsignedAddChange(`[["${data.bonus}d4[${element.type}]", "${element.type}"]]`, 20, "system.damage.parts"),
          ],
        };
      });
    }).flat();
  }

}
