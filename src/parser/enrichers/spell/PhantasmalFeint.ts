import DDBEnricherData from "../data/DDBEnricherData";

/** The Magus Class cantrip: a hit gives the next weapon or Unarmed Strike attack against the target Advantage before the caster's next turn. */
export default class PhantasmalFeint extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feinted",
        options: {
          expiry: "sourceStart",
          description: "The next attack with a weapon or Unarmed Strike against this creature before the start of the caster's next turn has Advantage.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("!isSpell", 20, "flags.automated-conditions-5e.grants.attack.advantage"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.mwak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.rwak"),
        ],
        daeSpecialDurations: ["isAttacked"],
      },
    ];
  }

}
