import DDBEnricherData from "../data/DDBEnricherData";

export default class ModifyMemory extends DDBEnricherData {

  // DDB tags only Charmed; the text adds Incapacitated while the charm lasts
  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        statuses: ["Incapacitated"],
        daeSpecialDurations: ["isDamaged"],
        options: {
          description: "The spell ends if the target takes any damage or is targeted by another spell.",
        },
      },
    ];
  }

}
