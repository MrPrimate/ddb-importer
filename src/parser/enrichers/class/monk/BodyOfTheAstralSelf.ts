import DDBEnricherData from "../../data/DDBEnricherData";

export default class BodyOfTheAstralSelf extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  /**
   * @returns {DDBActivityData}
   */
  override get activity(): IDDBActivityData {
    return {
      name: "Reduce Damage",
      targetType: "self",
      activationType: "reaction",
      type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      noConsumeTargets: true,
      data: {
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.wis.mod",
          types: ["healing"],
        }),
      },
    };
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Empowered Arms Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateTarget: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.die",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
        overrides: {
          activationCondition: "Once per turn",
          activationType: "special",
          targetType: "creature",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Empowered Arms (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a hit with the Arms of the Astral Self.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.monk.die; oncePerTurn; optin; item.name.includes('Astral')",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
