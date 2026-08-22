// import { utils } from "../../../../lib/_module";
// import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class SteelBond extends DDBEnricherData {

  // get effects(): IDDBEffectHint[] {
  //   return [
  //     {
  //       options: {
  //         transfer: true,
  //       },
  //       changes: DICTIONARY.actor.abilities.map((a) => {
  //         return [
  //           DDBEnricherData.ChangeHelper.addChange("@prof", 10, `system.abilities.${a.value}.save.roll.bonus`),
  //           DDBEnricherData.ChangeHelper.addChange("@prof", 10, `system.abilities.${a.value}.check.roll.bonus`),
  //         ];
  //       }).flat(),
  //     },
  //   ];
  // }

}
