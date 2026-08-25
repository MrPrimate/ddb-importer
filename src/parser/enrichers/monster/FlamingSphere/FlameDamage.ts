import DDBEnricherData from "../../data/DDBEnricherData";

export default class FlameDamage extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Any creature that ends its turn within 5 feet of the sphere ",
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "",
              types: ["fire"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Flaming Sphere: Heat",
        auraeffectsOnly: true,
        midiOnly: true,
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=${this.data.name} (Turn End),turn=end, saveAbility=dex, saveDC=(@flags.dnd5e.summon.level+10+@prof), saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@flags.dnd5e.summon.level)d6, damageType=fire, killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `5`,
          disposition: 0,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
