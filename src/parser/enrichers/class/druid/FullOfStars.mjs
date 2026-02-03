/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FullOfStars extends DDBEnricherData {

  get type() {
    return "none";
  }

  // get activity() {
  //   return {
  //     targetType: "self",
  //     activationType: "special",
  //   };
  // }

  // get effects() {
  //   return [
  //     {
  //       name: "Full of Stars (Level 14)",
  //       changes: [
  //         DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
  //         DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
  //         DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
  //       ],
  //     },
  //   ];
  // }

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbSecret">
<p><strong>Implementation Details</strong></p>
<p>This effect is automatically included in the Starry Form enchantment at the appropriate level.</p>
</section>`,
    };
  }
}


