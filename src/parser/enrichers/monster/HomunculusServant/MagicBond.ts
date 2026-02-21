// import { utils } from "../../../../lib/_module.mjs";
import { DICTIONARY } from "../../../../config/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class MagicBond extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: DICTIONARY.actor.abilities.map((a) => {
          return [
            DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.level", 10, `system.abilities.${a.value}.bonuses.save`),
            DDBEnricherData.ChangeHelper.addChange("@flags.dnd5e.summon.level", 10, `system.abilities.${a.value}.bonuses.check`),
          ];
        }).flat(),
      },
    ];
  }

}
