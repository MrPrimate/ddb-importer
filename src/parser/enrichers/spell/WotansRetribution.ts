import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Wotan's Retribution: teleport behind the creature that scored the critical hit, then make a
 * melee weapon attack with Advantage. The teleport applies the Advantage effect to the caster;
 * AC5e spends it on the next melee weapon attack, DAE removes the native version after one attack.
 */
export default class WotansRetribution extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Teleport",
      data: {
        range: {
          override: true,
          value: "",
          units: "ft",
          special: "Directly behind the creature that triggered the reaction",
        },
        target: {
          override: true,
          prompt: false,
          affects: {
            count: "1",
            type: "self",
          },
          template: {},
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const name = "Wotan's Retribution: Advantage";
    const description = "Advantage on your melee weapon attack against the creature that triggered Wotan's Retribution. On a hit it also takes damage equal to the damage it dealt you.";
    return [
      {
        name,
        ac5eOnly: true,
        options: { description },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "once; actionType.mwak",
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
        ],
      },
      {
        name,
        ac5eNever: true,
        options: { description },
        // dnd5e 5.x has no attack roll mode on the actor: Midi-QOL applies it
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.attack.mwak"),
        ],
        daeSpecialDurations: ["1Attack"],
      },
    ];
  }

}
