import DDBEnricherData from "../../data/DDBEnricherData";

export default class FormOfTheBeast extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Tail (reaction)",
      activationType: "reaction",
      targetType: "self",
      data: {
        roll: { prompt: false, visible: false, formula: "1d8", name: "AC Bonus" },
        // one effect per rolled result: Midi prompts for the one rolled rather than applying all eight
        midiProperties: { chooseEffects: true },
      },
    };
  }

  // dnd5e's ac.bonus resolves dice to 0, so the reaction rolls the d8 and the result's effect is applied
  override get effects(): IDDBEffectHint[] {
    return Array.from({ length: 8 }, (_, i) => i + 1).map((value) => ({
      name: `Form of the Beast: Tail AC +${value}`,
      options: {
        durationTurns: 1,
        expiry: "turnEnd",
      },
      daeSpecialDurations: ["isAttacked"],
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${value}`, 1, "system.attributes.ac.bonus"),
      ],
      data: {
        flags: {
          dae: {
            selfTarget: true,
            selfTargetAlways: true,
          },
        },
      },
    }));
  }

  // get override(): IDDBOverrideData {
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

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbFormOfTheBeast">
<p><strong>Implementation Details</strong></p>
<p>Bite, Claw and Tail attacks are added as character weapons.</p>
</section>`,
    };
  }

}
