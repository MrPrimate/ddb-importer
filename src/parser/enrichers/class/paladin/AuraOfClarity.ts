import DDBEnricherData from "../../data/DDBEnricherData";

export default class AuraOfClarity extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Aura of Clarity",
      options: {
        transfer: true,
        description: "You and your allies have Immunity to the Blinded condition while in your Aura of Protection, and you can see Invisible creatures within the aura.",
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("blinded", 20, "system.traits.ci.value"),
      ],
    }];
  }

}
