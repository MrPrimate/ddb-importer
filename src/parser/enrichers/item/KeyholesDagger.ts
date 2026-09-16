import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import utils from "../../../lib/Utils";
import { hasItemSource, itemActivity, itemUses } from "./_ItemActivities";

export default class KeyholesDagger extends DDBEnricherData {

  /** The higher DDB tiers omit the lower-tier rules that evolving items retain. */
  get tier(): number {
    if (!hasItemSource(this, 301)) {
      return 0;
    }
    const name = (this.ddbParser as DDBItem).ddbDefinition.name;
    return ({ Three: 1, Ten: 2, Many: 3 } as Record<string, number>)[name.split(" ")[0]] ?? 0;
  }

  static FORMS = [
    {
      name: "Handaxe",
      tier: 1,
      die: 6,
      damage: "slashing",
      mastery: "vex",
      properties: ["lgt", "thr"],
      range: 20,
      long: 60,
    },
    { name: "Mace", tier: 1, die: 6, damage: "bludgeoning", mastery: "sap", properties: [], range: 5, long: 5 },
    { name: "Club", tier: 2, die: 4, damage: "bludgeoning", mastery: "slow", properties: ["lgt"], range: 5, long: 5 },
    {
      name: "Greatclub",
      tier: 2,
      die: 8,
      damage: "bludgeoning",
      mastery: "push",
      properties: ["two"],
      range: 5,
      long: 5,
    },
    {
      name: "Javelin",
      tier: 2,
      die: 6,
      damage: "piercing",
      mastery: "slow",
      properties: ["thr"],
      range: 30,
      long: 120,
    },
    {
      name: "Light Hammer",
      tier: 2,
      die: 4,
      damage: "bludgeoning",
      mastery: "nick",
      properties: ["lgt", "thr"],
      range: 20,
      long: 60,
    },
    {
      name: "Quarterstaff",
      tier: 2,
      die: 6,
      versatile: 8,
      damage: "bludgeoning",
      mastery: "topple",
      properties: ["ver"],
      range: 5,
      long: 5,
    },
    { name: "Sickle", tier: 2, die: 4, damage: "slashing", mastery: "nick", properties: ["lgt"], range: 5, long: 5 },
    {
      name: "Spear",
      tier: 2,
      die: 6,
      versatile: 8,
      damage: "piercing",
      mastery: "sap",
      properties: ["ver", "thr"],
      range: 20,
      long: 60,
    },
    {
      name: "Battleaxe",
      tier: 3,
      die: 8,
      versatile: 10,
      damage: "slashing",
      mastery: "topple",
      properties: ["ver"],
      range: 5,
      long: 5,
    },
    {
      name: "Longsword",
      tier: 3,
      die: 8,
      versatile: 10,
      damage: "slashing",
      mastery: "sap",
      properties: ["ver"],
      range: 5,
      long: 5,
    },
    { name: "Rapier", tier: 3, die: 8, damage: "piercing", mastery: "vex", properties: ["fin"], range: 5, long: 5 },
    { name: "Scimitar", tier: 3, die: 6, damage: "slashing", mastery: "nick", properties: ["fin", "lgt"], range: 5, long: 5 },
    {
      name: "Warhammer",
      tier: 3,
      die: 8,
      versatile: 10,
      damage: "bludgeoning",
      mastery: "push",
      properties: ["ver"],
      range: 5,
      long: 5,
    },
  ];

  override get activity(): IDDBActivityData | null {
    return this.tier ? { noConsumeTargets: true, allowCritical: true } : null;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.tier === 0;
  }

  override get override(): IDDBOverrideData | null {
    if (!this.tier) {
      return null;
    }
    return {
      ...(this.tier === 3 ? itemUses(this, "1", [{ period: "dawn", type: "recoverAll" }]) : {}),
      data: {
        "system.magicalBonus": this.tier,
        // Native proficiency must follow the current form, rather than the imported dagger's proficiency override.
        "system.proficient": null,
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.tier) {
      return [];
    }
    const activities = [
      itemActivity("Transform Weapon", DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        activationCondition: "When you take the Attack action; the weapon reverts at the start of your next turn",
        data: {
          enchant: { self: true },
          restrictions: { type: "weapon", allowMagical: true },
          duration: { value: "1", units: "round" },
        },
      }),
    ];
    if (this.tier === 3) {
      activities.push(
        itemActivity("Reroll Miss", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
          addItemConsume: true,
          activationCondition: "After missing with this weapon, reroll that attack manually and use the second roll",
        }),
      );
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.tier) {
      return [];
    }
    return [
      {
        noCreate: true,
        func: ({ effect }) => {
          // DDB's melee-weapon modifier becomes a global attack bonus unless replaced with magicalBonus.
          if (effect.system?.changes) {
            effect.system.changes = effect.system.changes.filter(
              (change: IActiveEffectChangeData) => change.key !== "system.rolls.attack.mwak.bonus",
            );
          }
        },
      },
      ...KeyholesDagger.FORMS.filter((form) => form.tier <= this.tier).map(
        (form): IDDBEffectHint => ({
          name: `Keyholes Form: ${form.name}`,
          type: "enchant",
          activityMatch: "Transform Weapon",
          data: { _id: utils.namedIDStub(`Keyholes ${form.name}`, { prefix: "ddb" }) },
          options: {
            transfer: false,
            durationSeconds: null,
            expiry: "sourceStart",
            description: "Retains the dagger's magic bonus and choice of Strength or Dexterity. Reverts next turn.",
          },
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange(`{} (${form.name})`, 20, "name"),
            DDBEnricherData.ChangeHelper.overrideChange(
              form.name.toLowerCase().replace(/ /g, ""),
              20,
              "system.type.baseItem",
            ),
            DDBEnricherData.ChangeHelper.overrideChange(
              form.tier === 3 ? "martialM" : "simpleM",
              20,
              "system.type.value",
            ),
            DDBEnricherData.ChangeHelper.overrideChange(form.mastery, 20, "system.mastery"),
            DDBEnricherData.ChangeHelper.overrideChange(form.die, 20, "system.damage.base.denomination"),
            DDBEnricherData.ChangeHelper.overrideChange(form.damage, 20, "system.damage.base.types"),
            // Ability choice does not grant Finesse to forms that lack that property.
            DDBEnricherData.ChangeHelper.overrideChange(
              JSON.stringify(["str", "dex"]),
              20,
              "activities[attack].attack.abilities",
            ),
            DDBEnricherData.ChangeHelper.overrideChange(
              JSON.stringify(["mgc", ...form.properties]),
              20,
              "system.properties",
            ),
            DDBEnricherData.ChangeHelper.overrideChange(form.range, 20, "system.range.value"),
            DDBEnricherData.ChangeHelper.overrideChange(form.long, 20, "system.range.long"),
            ...(form.versatile
              ? [
                DDBEnricherData.ChangeHelper.overrideChange(
                  JSON.stringify(DDBEnricherData.basicDamagePart({ number: 1, denomination: form.versatile })),
                  20,
                  "system.damage.versatile",
                ),
              ]
              : []),
          ],
        }),
      ),
    ];
  }

}
