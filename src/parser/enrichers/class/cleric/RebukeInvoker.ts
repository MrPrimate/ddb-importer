import DDBEnricherData from "../../data/DDBEnricherData";

export default class RebukeInvoker extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      activationCondition: "A creature you can see within 60 ft uses a Magic action to cast a spell (+1d8 per level of the spell slot expended)",
      data: {
        damage: {
          onSave: "half",
        },
      },
    };
  }

}
