/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TwinklingConstellations extends DDBEnricherData {
  get type() {
    return "none";
  }

  // get activity() {
  //   return {
  //     noTemplate: true,
  //     targetType: "self",
  //     noConsumeTargets: true,
  //     noeffect: true,
  //     activationType: "turnStart",
  //     activationCondition: "Start of each turn",
  //   };
  // }

  // get effects() {
  //   return [
  //     {
  //       name: "Twinkling Constellations (Level 10)",
  //       changes: [
  //         DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "system.attributes.movement.fly"),
  //         DDBEnricherData.ChangeHelper.upgradeChange("true", 20, "system.attributes.movement.hover"),
  //       ],
  //     },
  //   ];
  // }

  // get useDefaultAdditionalActivities() {
  //   return true;
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
