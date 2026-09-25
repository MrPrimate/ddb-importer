import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * A passive 10-foot emanation: the cleric and allies inside add 2 to Intelligence, Wisdom and
 * Charisma saves. DDB ships that bonus as modifiers on the cleric alone, so the parsed effect is
 * kept on the cleric and marked as an aura for Active Auras or Aura Effects to share with allies.
 * It switches off while the cleric is Incapacitated, which nothing here can test.
 */
export default class GestaltAnchor extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: { transfer: true },
        noCreate: true,
        daeStackable: "noneNameOnly",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "10",
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
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
