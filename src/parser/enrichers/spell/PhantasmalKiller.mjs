/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../config/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PhantasmalKiller extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        changes: DICTIONARY.actor.abilities.map((ability) => DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.check.roll.mode`)),
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=${this.data.name} Turn End,turn=end, saveAbility=wis, saveDC=@attributes.spell.dc, saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@item.level)d10, damageType=psychic, killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}

