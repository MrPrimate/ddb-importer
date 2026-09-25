import DDBEnricherData from "../data/DDBEnricherData";

/**
 * While wielded the halberd is a 10-foot emanation. An ally that starts its turn inside gains
 * 5 feet of Speed for that turn, which is carried here as an aura on the wielder that grants the
 * Speed to allies while they stay inside; it needs Active Auras or Aura Effects. The Proficiency
 * Bonus added to saves against the Frightened condition depends on what the save is against,
 * which no effect can test, so it stays a note on the aura.
 */
export default class KnightsStandardOfValor extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fervor and Valor",
        aurasOnly: true,
        daeStackable: "noneNameOnly",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("5", 20, "system.attributes.movement.walk"),
        ],
        options: {
          transfer: true,
          description: "An ally that starts its turn within 10 feet of the wielder has its Speed increased by 5 feet until the end of the turn. The wielder and allies inside add their Proficiency Bonus to saves against the Frightened condition.",
        },
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "10",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "10",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
