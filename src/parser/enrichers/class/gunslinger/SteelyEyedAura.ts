import DDBEnricherData from "../../data/DDBEnricherData";

const AURA = "Steely-Eyed Aura";

/**
 * You and allies within the emanation have Advantage on saves to avoid or end the Frightened
 * condition. The aura is a transfer effect on the gunslinger that Active Auras or Aura Effects
 * extend to allies inside; dnd5e cannot condition a save bonus on what it is against, so the
 * advantage rides on AC5e's status filter and is otherwise a marker for the table.
 */
export default class SteelyEyedAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "ally",
      activationType: "special",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.white-hat.steely-eyed-aura",
            units: "ft",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: AURA,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "riderStatuses.frightened",
            20,
            "flags.automated-conditions-5e.save.advantage",
          ),
        ],
        options: {
          transfer: true,
          description: "You and allies within the Emanation have Advantage on saving throws made to avoid or end the Frightened condition. Inactive while you are Incapacitated.",
        },
        daeStackable: "noneNameOnly",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "@scale.white-hat.steely-eyed-aura",
              isAura: true,
              ignoreSelf: false,
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
          distanceFormula: "@scale.white-hat.steely-eyed-aura",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: AURA,
          script: `!sourceToken.actor.statuses.has("incapacitated")`,
        },
      },
    ];
  }

}
