import { DICTIONARY } from "../../../config/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class PhantasmalKiller extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        changes: DICTIONARY.actor.abilities.map((ability) => DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange(ability.value)),
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

