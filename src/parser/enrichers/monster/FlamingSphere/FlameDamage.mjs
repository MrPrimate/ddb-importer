/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FlameDamage extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Any creature that ends its turn within 5 feet of the sphere ",
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "",
              types: ["fire"],
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Flaming Sphere: Heat",
        activeAurasOnly: true,
        midiOnly: true,
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=${this.data.name} (Turn End),turn=end, saveAbility=dex, saveDC=(@flags.dnd5e.summon.level+10+@prof), saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@flags.dnd5e.summon.level)d6, damageType=fire, killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        data: {
          flags: {
            ActiveAuras: {
              isAura: true,
              aura: "All",
              radius: 5,
              alignment: "",
              type: "",
              ignoreSelf: false,
              height: false,
              hidden: false,
              onlyOnce: false,
              displayTemp: true,
            },
          },
        },
      },
    ];
  }

}
