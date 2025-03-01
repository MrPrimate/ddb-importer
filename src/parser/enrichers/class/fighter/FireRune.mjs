/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FireRune extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Invoke Rune",
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      activationCondition: "You hit a creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: ["fire"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    if (this.isAction) return [];
    return [
      {
        constructor: {
          name: "Save vs Constrained",
          type: "save",
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        activityMatch: "Save vs Constrained",
        name: "Fire Rune: Restrained",
        options: {
          durationSeconds: 60,
        },
        // noCreate: true,
        statuses: ["Restrained"],
      },
      {
        noCreate: true,
        activityMatch: "Save vs Constrained",
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Fire Rune (Start of Turn Damage),turn=start,savingThrow=false,damageRoll=2d6,damageType=fire,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
          DDBEnricherData.ChangeHelper.customChange(
            "label=Fire Rune (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=str,savingThrow=true,saveMagic=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      name: "Fire Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
