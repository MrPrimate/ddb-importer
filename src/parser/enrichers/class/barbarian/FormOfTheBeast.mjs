/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FormOfTheBeast extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Tail (reaction)",
    };
  }

  get effects() {
    return [
      {
        name: "Form of the Beast: Tail AC Bonus",
        options: {
          durationTurns: 1,
        },
        daeSpecialDurations: ["isAttacked"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d8", 1, "system.attributes.ac.bonus"),
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  // get override() {
  //   return {
  //     data: {
  //       "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
  //         ? utils.addToProperties(this.data.system.properties, "mgc")
  //         : this.data.system.properties),
  //     },
  //   };
  // }

  // get useDefaultAdditionalActivities() {
  //   return true;
  // }

  // get addToDefaultAdditionalActivities() {
  //   return true;
  // }

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbFormOfTheBeast">
<p><strong>Implementation Details</strong></p>
<p>Bite, Claw and Tail attacks are added as character weapons.</p>
</section>`,
    };
  }

}
