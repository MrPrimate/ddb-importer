/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class TrueStrike extends DDBEnricherData {

  get type() {
    return this.is2014 ? null : "enchant";
  }

  get activity() {
    if (this.is2014) {
      return null;
    } else {
      return {
        name: "Enchant Weapon",
        data: {
          restrictions: {
            type: "weapon",
            allowMagical: true,
          },
        },
      };
    }
  }

  get effects() {
    if (this.is2014) {
      return [{
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      }];
    } else {
      return [
        { type: "Melee", img: "icons/skills/melee/strike-sword-slashing-red.webp" },
        { type: "Ranged", img: "icons/skills/ranged/arrow-strike-glowing-teal.webp" },
      ].map((data) => {
        return {
          type: "enchant",
          name: `${data.type} Weapon`,
          options: {
            description: `This weapon is infused with True Strike`,
          },
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange("{} (True Strike)", 20, "name"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.damage.base.types"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("(floor((@details.level + 1) / 6))d6[radiant]", 20, "system.damage.base.bonus"),
            DDBEnricherData.ChangeHelper.overrideChange("spellcasting", 20, "activities[attack].attack.ability"),
          ],
          data: {
            img: data.img,
          },
        };
      });
    }
  }

}
