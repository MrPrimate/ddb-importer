/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
// import { DICTIONARY } from "../../../../config/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

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
