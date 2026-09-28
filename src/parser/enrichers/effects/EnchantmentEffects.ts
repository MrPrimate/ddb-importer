import ChangeHelper from "./ChangeHelper";
import AutoEffects from "./AutoEffects";

export default class EnchantmentEffects {

  static EnchantmentEffect(document: TAll5eItemDocuments, label: string,
    { transfer = false, disabled = false, origin = null as string | null, id = null as string | null, description = null as string | null,
      durationSeconds = undefined as number | null | undefined, showIcon = undefined as TEffectShowIcon | undefined } = {},
  ) {
    // durationSeconds passes through untouched: null clears an inherited duration, undefined inherits
    const effect: I5eEffectData = AutoEffects.BaseEffect(document, label, {
      transfer,
      disabled,
      description: description ?? undefined,
      durationSeconds,
      showIcon,
    });
    effect.type = "enchantment";
    effect._id = id ?? foundry.utils.randomID();
    if (origin) AutoEffects.setEffectOrigin(effect, origin, "item");
    return effect;
  }


  static CONSUMPTION_CLEAR = /^(?:activities\[(?<type>[^\]]+)\]|system\.activities\.(?<id>[^.]+))\.consumption\.targets$/;

  /**
   * Rewrite enchantment changes that clear an activity's consumption with an override of "[]"
   * (the free "Deactivate" of a self enchantment) into one "0" override per existing target.
   *
   * The "[]" form only survives on a freshly created effect. Once the item is recreated from
   * toObject() data (a compendium import, a duplicated actor), Foundry 14's ActiveEffect
   * migrateData JSON-parses the value into a real array, and ArrayField._castChangeDelta wraps a
   * non-string as a single element, so the activity gains one blank target (activityUses) and the
   * next use fails for want of uses. A "0" value parses to 0 and casts back, so zeroing each
   * target keeps working. Runs once activities and effects are both built.
   */
  static zeroConsumptionClears(document: TAll5eItemDocuments): void {
    const activities = Object.entries(
      (foundry.utils.getProperty(document, "system.activities") ?? {}) as Record<string, I5eActivity>,
    );
    for (const effect of document.effects ?? []) {
      const changes = effect.system?.changes;
      if (!changes?.length) continue;
      effect.system!.changes = changes.flatMap((change) => {
        const match = EnchantmentEffects.CONSUMPTION_CLEAR.exec(change.key);
        const empty = change.type === "override"
          && (change.value === "[]" || (Array.isArray(change.value) && change.value.length === 0));
        if (!match?.groups || !empty) return [change];
        const { type, id } = match.groups;
        // a type selector can match activities with different target counts, so each is keyed by id
        return activities
          .filter(([activityId, activity]) => (id ? activityId === id : activity.type === type))
          .flatMap(([activityId, activity]) => (activity.consumption?.targets ?? []).map((_target, index) =>
            ChangeHelper.overrideChange("0", change.priority ?? 20, `system.activities.${activityId}.consumption.targets.${index}.value`)));
      });
    }
  }

  static addMagicalBonus({ effect, nameAddition = null, bonus = null, bonusMode = "override",
    makeMagical = true }: { effect: I5eEffectData; nameAddition?: string | null; bonus?: string | null; bonusMode?: TActiveEffectChangeType; makeMagical?: boolean },
  ) {
    const name = nameAddition
      ? `, ${nameAddition}`
      : ` (${effect.name})`;
    const system = (effect.system ??= {});
    const changes = (system.changes ??= []);
    const change = ChangeHelper.overrideChange(`{}${name}`, 20, "name");
    changes.push(change);
    if (bonus !== null) {
      changes.push(
        {
          key: "system.magicalBonus",
          type: bonusMode,
          value: `${bonus}`,
          priority: 20,
        },
      );
    }

    if (makeMagical) {
      const magicalChange = ChangeHelper.addChange("mgc", 20, "system.properties");
      changes.push(magicalChange);
    }
    return effect;
  }

}
