import DDBEnricherData from "../data/DDBEnricherData";

export default class SquireOfSolamniaPreciseStrike extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: false,
        },
        macroChanges: [
          { macroValues: `${this.data.name}`, macroType: "feat", macroName: "squireOfSolamnia.js" },
        ],
        onUseMacroChanges: [
          { macroPass: "postAttackRoll", macroType: "feat", macroName: "squireOfSolamnia.js", document: this.data },
        ],
        // the mode is core; the hint stays midi-only because the 1Attack DAE duration is what
        // limits it to a single weapon attack
        changes: [
          DDBEnricherData.ChangeHelper.advantageAttackChange("mwak"),
          DDBEnricherData.ChangeHelper.advantageAttackChange("rwak"),
        ],
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "squireOfSolamnia.js", document: this.data },
        ],
        daeSpecialDurations: ["1Attack"],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "squireOfSolamnia.js",
    };
  }

}
