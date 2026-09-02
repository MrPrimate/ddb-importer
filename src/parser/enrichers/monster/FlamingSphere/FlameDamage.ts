import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The importer-built Flaming Sphere summon. Using Flame Damage from the sphere
 * token places a 5-foot emanation attached to it, so every creature that ends
 * its turn inside gets the Dex save; the sphere itself never saves. Ramming the
 * sphere into a creature is the mover's own trigger and stays on Move and
 * Attack. The auraeffects + midi OverTime effect below is the module arm of the
 * same automation, so the region arm only emits without Aura Effects.
 */
export default class FlameDamage extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Any creature that ends its turn within 5 feet of the sphere",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "5",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnEnd"],
            excludeSelf: true,
            auraeffectsNever: true,
          }),
        ],
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
