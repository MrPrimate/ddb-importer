import ChangeHelper from "./ChangeHelper";
import AutoEffects from "./AutoEffects";

export default class EnchantmentEffects {

  static EnchantmentEffect(document: TAll5eItemDocuments, label: string,
    { transfer = false, disabled = false, origin = null as string | null, id = null as string | null, description = null as string | null, durationSeconds = null as number | null,
      durationRounds = null as number | null, durationTurns = null as number | null } = {},
  ) {
    const effect: I5eEffectData = AutoEffects.BaseEffect(document, label, {
      transfer,
      disabled,
      description: description ?? undefined,
      durationSeconds: durationSeconds ?? undefined,
      durationRounds: durationRounds ?? undefined,
      durationTurns,
    });
    foundry.utils.setProperty(effect, "flags.dnd5e.type", "enchantment");
    effect._id = id ?? foundry.utils.randomID();
    effect.origin = origin ?? undefined;
    return effect;
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
