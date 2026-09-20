import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Bestow Curse: four curse options, one save each, with the six ability curses as separate effects on the first option so the caster applies the chosen ability.
 */
export default class BestowCurse extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Curse Ability",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "curseAttacks0001",
        overrides: {
          name: "Curse Attacks",
        },
      },
      {
        duplicate: true,
        id: "curseActions0001",
        overrides: {
          name: "Curse Actions",
        },
      },
      {
        duplicate: true,
        id: "curseResilien001",
        overrides: {
          name: "Curse Resilience",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: ["necrotic"],
            }),
          ],
          data: {
            damage: {
              onSave: "none",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cursed Strength",
        activityMatch: "Curse Ability",
        statuses: ["Cursed"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.str.check.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.str.save.roll.mode"),
        ],
      },
      {
        name: "Cursed Dexterity",
        activityMatch: "Curse Ability",
        statuses: ["Cursed"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.dex.check.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.dex.save.roll.mode"),
        ],
      },
      {
        name: "Cursed Constitution",
        activityMatch: "Curse Ability",
        statuses: ["Cursed"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.con.check.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.con.save.roll.mode"),
        ],
      },
      {
        name: "Cursed Intelligence",
        activityMatch: "Curse Ability",
        statuses: ["Cursed"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.int.check.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.int.save.roll.mode"),
        ],
      },
      {
        name: "Cursed Wisdom",
        activityMatch: "Curse Ability",
        statuses: ["Cursed"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.wis.check.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.wis.save.roll.mode"),
        ],
      },
      {
        name: "Cursed Charisma",
        activityMatch: "Curse Ability",
        statuses: ["Cursed"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.cha.check.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1", 20, "system.abilities.cha.save.roll.mode"),
        ],
      },
      {
        name: "Cursed Attacks",
        activityMatch: "Curse Attacks",
        statuses: ["Cursed"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        options: {
          description: "Disadvantage on attack rolls against the caster.",
        },
      },
      {
        name: "Cursed Actions",
        activityMatch: "Curse Actions",
        statuses: ["Cursed"],
        options: {
          description: "In combat, the target must succeed on a Wisdom saving throw at the start of each of its turns or waste its action doing nothing.",
        },
      },
      {
        name: "Cursed Resilience",
        activityMatch: "Curse Resilience",
        statuses: ["Cursed"],
        options: {
          description: "Attacks and spells from the caster that deal damage to the target deal an extra 1d8 necrotic damage.",
        },
      },
    ];
  }

}
