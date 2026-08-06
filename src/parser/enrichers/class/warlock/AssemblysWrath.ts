import DDBEnricherData from "../../data/DDBEnricherData";

export default class AssemblysWrath extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Summon the Courtiers: Assembly's Wrath",
        activityMatch: "Assembly's Wrath",
        statuses: ["Blinded", "Prone"],
        options: {
          durationRounds: 1,
          description: "Blinded and Prone until the end of the warlock's next turn.",
        },
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
