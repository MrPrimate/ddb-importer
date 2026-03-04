import DDBEnricherData from "../data/DDBEnricherData";

export default class Invisibility extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        data: {
          "flags.dae.specialDuration": ["1Attack", "1Spell"],
        },
      },
    ];
  }

}
