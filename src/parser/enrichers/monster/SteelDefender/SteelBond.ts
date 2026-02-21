// import { utils } from "../../../../lib/_module";
// import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class SteelBond extends DDBEnricherData {

  // get effects() {
  //   return [
  //     {
  //       options: {
  //         transfer: true,
  //       },
  //       changes: DICTIONARY.actor.abilities.map((a) => {
  //         return [
  //           DDBEnricherData.ChangeHelper.addChange("@prof", 10, `system.abilities.${a.value}.bonuses.save`),
  //           DDBEnricherData.ChangeHelper.addChange("@prof", 10, `system.abilities.${a.value}.bonuses.check`),
  //         ];
  //       }).flat(),
  //     },
  //   ];
  // }

}
