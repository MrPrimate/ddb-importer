import DDBEnricherData from "../data/DDBEnricherData";

const PROTECTED_FROM: TCreatureTypes[] = ["aberration", "celestial", "elemental", "fey", "fiend", "undead"];

/**
 * Attackers of the listed creature types roll with Disadvantage against the protected creature.
 * In a grants flag AC5e's rollingActor is the attacker, so the type check runs on them. The
 * charm, fright and possession protection only applies against those creatures, which an effect
 * cannot scope, so it stays in the description.
 */
export default class ProtectionFromEvilAndGood extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const typeCondition = PROTECTED_FROM
      .map((type) => `rollingActor.creatureType.includes('${type}')`)
      .join(" || ");
    return [
      {
        options: {
          durationSeconds: 600,
          description: "Aberrations, Celestials, Elementals, Fey, Fiends and Undead have Disadvantage on attack rolls against you, and can't charm, frighten or possess you.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            typeCondition,
            20,
            "flags.automated-conditions-5e.grants.attack.disadvantage",
          ),
        ],
      },
    ];
  }

}
