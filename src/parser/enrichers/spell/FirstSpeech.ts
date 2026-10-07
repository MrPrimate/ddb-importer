import DDBEnricherData from "../data/DDBEnricherData";

/** The Magus Class: for an hour, add the spellcasting modifier (minimum +1) to Deception, Intimidation and Persuasion checks, and speak with all creatures and plants. */
export default class FirstSpeech extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "First Speech",
        options: {
          durationSeconds: 3600,
          description: "You can comprehend and verbally communicate with all creatures and plants.",
        },
        changes: ["dec", "itm", "per"].map((skill) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(1, @attributes.spell.mod)", 20, `system.skills.${skill}.bonuses.check`),
        ),
      },
    ];
  }

}
