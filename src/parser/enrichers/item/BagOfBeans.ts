import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dump Beans is the primary save: a 10 ft sphere of 5d4 damage (fire in 2014, force in 2024),
 * half on a save. The 2014 bag empties at once; the 2024 one dumps one bean by default, scaling
 * the consumption up to the beans left but never the damage. Item uses are the bean count: they
 * start at 12 all spent, and the one-shot Count Beans utility consumes -3d4 uses to hand the
 * rolled count back. Plant Bean spends one bean and leaves the table roll to the player. The
 * parser's automatic extra activities are off because every mode is authored here.
 */
export default class BagOfBeans extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  /** 2014 beans explode into fire, the 2024 reprint into force. */
  get explosionDamageType(): string {
    return this.is2014 ? "fire" : "force";
  }

  override get activity(): IDDBActivityData {
    // 2014 dumps the bag's whole contents; the 2024 reprint lets you dump one or more beans. The
    // explosion is 5d4 however many beans go, so the bean count scales consumption, never damage.
    const consumption: IDDBActivityData = {
      addItemConsume: true,
      itemConsumeValue: "@item.uses.value",
    };
    if (!this.is2014) {
      consumption.itemConsumeValue = 1;
      consumption.addScalingMode = "amount";
      consumption.addConsumptionScalingMax = "@item.uses.value";
    }
    return {
      name: "Dump Beans",
      activationType: "special",
      activationCondition: "Object interaction",
      rangeSelf: true,
      ...consumption,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          number: 5,
          denomination: 4,
          type: this.explosionDamageType,
          scalingMode: "none",
          scalingNumber: null,
        }),
      ],
      data: {
        damage: {
          onSave: "half",
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            type: "sphere",
            size: "10",
            units: "ft",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Count Beans",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          generateDamage: false,
          activationOverride: {
            // the SRD leaves this blank; "none" is our nearest legal value and reads the same
            type: "none",
            value: null,
            condition: "Upon discovering the bag",
          },
        },
        overrides: {
          noTemplate: true,
          targetType: "object",
          data: {
            description: {
              chatFlavor: "3d4 dry beans found in bag.",
            },
            // a negative consumption ADDS uses, so rolling this sets the bag's bean count
            consumption: {
              targets: [
                { type: "itemUses", value: "-3d4", target: "", scaling: {} },
                { type: "activityUses", value: "1", scaling: {} },
              ],
            },
            uses: {
              spent: 0,
              max: "1",
              recovery: [],
            },
            target: {
              affects: {
                count: "1",
                type: "object",
                special: "Held Bag of Beans",
              },
            },
          },
        },
      },
      {
        init: {
          name: "Plant Bean",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          generateDamage: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Object interaction",
          },
        },
        overrides: {
          noTemplate: true,
          targetType: "space",
          data: {
            description: {
              chatFlavor: "The bean produces an effect 1 minute later; roll on the Bag of Beans table.",
            },
            consumption: {
              targets: [
                { type: "itemUses", value: "1", target: "" },
              ],
            },
            target: {
              affects: {
                count: "1",
                type: "space",
                special: "Dirt or sand",
              },
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      // the bag holds 3d4 beans, so 12 is the most it can be found with. It starts with every use
      // spent, and Count Beans' negative consumption hands back the number actually rolled.
      uses: {
        spent: 12,
        max: "12",
        recovery: [],
      } as I5eSystemLimitedUses,
    };
  }

}
