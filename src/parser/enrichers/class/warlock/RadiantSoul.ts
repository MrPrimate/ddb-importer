import DDBEnricherData from "../../data/DDBEnricherData";

export default class RadiantSoul extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Damage bonus",
      noeffect: true,
      activationType: "special",
      activationCondition: "1/turn. Damage someone with a radiant or fire",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          bonus: "@abilities.cha.mod",
          types: ["radiant", "fire"],
        }),
      ],
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Radiant Soul (Automation)",
        options: {
          transfer: true,
          durationSeconds: null,
          durationRounds: null,
        },
        midiOnly: true,
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "radiantSoul.js", document: this.data },
        ],
        data: {
          duration: {
            value: null,
            expiry: null,
            expired: null,
          },
        },
      },
    ];
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "radiantSoul.js",
    };
  }

}
