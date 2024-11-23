import { SpellEnrichers } from "./_module.mjs";
import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";

export default class DDBSpellEnricher extends DDBEnricherMixin {
  constructor({ activityGenerator, notifier = null } = {}) {
    super({
      activityGenerator,
      effectType: "spell",
      enricherType: "spell",
      notifier,
    });
  }

  load({ ddbParser, document, name = null, notifier = null } = {}) {
    super.load({ ddbParser, document, name, notifier });
    this._prepare();
  }

  NAME_HINTS_2014 = {};

  NAME_HINTS = {
    "Bigby's Hand": "Arcane Hand",
    "Melf's Acid Arrow": "Acid Arrow",
    "Mordenkainen's Sword": "Arcane Sword",
    "Evard's Black Tentacles": "Black Tentacles",
  };

  ENRICHERS = {
    "Absorb Elements": SpellEnrichers.AbsorbElements,
    "Acid Arrow": SpellEnrichers.AcidArrow,
    "Aid": SpellEnrichers.Aid,
    "Alter Self": SpellEnrichers.AlterSelf,
    "Animal Friendship": SpellEnrichers.AnimalFriendship,
    "Animate Objects": SpellEnrichers.AnimateObjects,
    "Arcane Eye": SpellEnrichers.ArcaneEye,
    "Arcane Hand": SpellEnrichers.ArcaneHand,
    "Arcane Sword": SpellEnrichers.ArcaneSword,
    "Arcane Vigor": SpellEnrichers.ArcaneVigor,
    "Armor of Agathys": SpellEnrichers.ArmorOfAgathys,
    "Aura of Life": SpellEnrichers.AuraOfLife,
    "Bane": SpellEnrichers.Bane,
    "Barkskin": SpellEnrichers.Barkskin,
    "Blade Ward": SpellEnrichers.BladeWard,
    "Bless": SpellEnrichers.Bless,
    "Bones of the Earth": SpellEnrichers.BonesOfTheEarth,
    "Booming Blade": SpellEnrichers.BoomingBlade,
    "Call Lightning": SpellEnrichers.CallLightning,
    "Catapult": SpellEnrichers.Catapult,
    "Chaos Bolt": SpellEnrichers.ChaosBolt,
    "Chill Touch": SpellEnrichers.ChillTouch,
    "Chromatic Orb": SpellEnrichers.ChromaticOrb,
    "Color Spray": SpellEnrichers.ColorSpray,
    "Command": SpellEnrichers.Command,
    "Control Weather": SpellEnrichers.ControlWeather,
    "Counterspell": SpellEnrichers.Counterspell,
    "Dancing Lights": SpellEnrichers.DancingLights,
    "Darkness": SpellEnrichers.Darkness,
    "Darkvision": SpellEnrichers.Darkvision,
    "Divine Favor": SpellEnrichers.DivineFavor,
    "Divine Smite": SpellEnrichers.DivineSmite,
    "Dragon's Breath": SpellEnrichers.DragonsBreath,
    "Eldritch Blast": SpellEnrichers.EldritchBlast,
    "Elemental Weapon": SpellEnrichers.ElementalWeapon,
    "Faerie Fire": SpellEnrichers.FaerieFire,
    "False Life": SpellEnrichers.FalseLife,
    "Feeblemind": SpellEnrichers.Feeblemind,
    "Fire Shield": SpellEnrichers.FireShield,
    "Flaming Sphere": SpellEnrichers.FlamingSphere,
    "Fly": SpellEnrichers.Fly,
    "Fount of Moonlight": SpellEnrichers.FountOfMoonlight,
    "Glyph of Warding": SpellEnrichers.GlyphOfWarding,
    "Green-Flame Blade": SpellEnrichers.GreenFlameBlade,
    "Gust of Wind": SpellEnrichers.GustOfWind,
    "Haste": SpellEnrichers.Haste,
    "Heat Metal": SpellEnrichers.HeatMetal,
    "Heroes' Feast": SpellEnrichers.HeroesFeast,
    "Heroism": SpellEnrichers.Heroism,
    "Hex": SpellEnrichers.Hex,
    "Hunger of Hadar": SpellEnrichers.HungerOfHadar,
    "Hunter's Mark": SpellEnrichers.HuntersMark,
    "Invisibility": SpellEnrichers.Invisibility,
    "Jallarzi's Storm of Radiance": SpellEnrichers.JallarzisStormOfRadiance,
    "Light": SpellEnrichers.Light,
    "Mage Armor": SpellEnrichers.MageArmor,
    "Mage Hand": SpellEnrichers.MageHand,
    "Magic Weapon": SpellEnrichers.MagicWeapon,
    "Mass Suggestion": SpellEnrichers.MassSuggestion,
    "Mind Blank": SpellEnrichers.MindBlank,
    "Mirror Image": SpellEnrichers.MirrorImage,
    "Pass Without Trace": SpellEnrichers.PassWithoutTrace,
    "Power Word Fortify": SpellEnrichers.PowerWordFortify,
    "Primal Savagery": SpellEnrichers.PrimalSavagery,
    "Prismatic Wall": SpellEnrichers.PrismaticWall,
    "Produce Flame": SpellEnrichers.ProduceFlame,
    "Protection from Energy": SpellEnrichers.ProtectionFromEnergy,
    "Protection from Poison": SpellEnrichers.ProtectionFromPoison,
    "Pyrotechnics": SpellEnrichers.Pyrotechnics,
    "Ray of Enfeeblement": SpellEnrichers.RayOfEnfeeblement,
    "Ray of Sickness": SpellEnrichers.RayOfSickness,
    "Scorching Ray": SpellEnrichers.ScorchingRay,
    "Searing Smite": SpellEnrichers.SearingSmite,
    "Shadow Blade": SpellEnrichers.ShadowBlade,
    "Shield of Faith": SpellEnrichers.ShieldOfFaith,
    "Shield": SpellEnrichers.Shield,
    "Shillelagh": SpellEnrichers.Shillelagh,
    "Shining Smite": SpellEnrichers.ShiningSmite,
    "Sleep": SpellEnrichers.Sleep,
    "Slow": SpellEnrichers.Slow,
    "Sorcerous Burst": SpellEnrichers.SorcerousBurst,
    "Spider Climb": SpellEnrichers.SpiderClimb,
    "Spike Growth": SpellEnrichers.SpikeGrowth,
    "Spirit Guardians": SpellEnrichers.SpiritGuardians,
    "Spirit Shroud": SpellEnrichers.SpiritShroud,
    "Spiritual Weapon": SpellEnrichers.SpiritualWeapon,
    "Stoneskin": SpellEnrichers.Stoneskin,
    "Suggestion": SpellEnrichers.Suggestion,
    "Synaptic Static": SpellEnrichers.SynapticStatic,
    "Tasha's Bubbling Cauldron": SpellEnrichers.TashasBubblingCauldron,
    "Tasha's Caustic Brew": SpellEnrichers.TashasCausticBrew,
    "Thunder Step": SpellEnrichers.ThunderStep,
    "Thunderclap": SpellEnrichers.Thunderclap,
    "Tidal Wave": SpellEnrichers.TidalWave,
    "Toll the Dead": SpellEnrichers.TollTheDead,
    "True Strike": SpellEnrichers.TrueStrike,
    "Vitriolic Sphere": SpellEnrichers.VitriolicSphere,
    "Wall of Fire": SpellEnrichers.WallOfFire,
    "Wall of Force": SpellEnrichers.WallOfForce,
    "Wall of Ice": SpellEnrichers.WallOfIce,
    "Wall of Light": SpellEnrichers.WallOfLight,
    "Wall of Sand": SpellEnrichers.WallOfSand,
    "Wall of Stone": SpellEnrichers.WallOfStone,
    "Wall of Thorns": SpellEnrichers.WallOfThorns,
    "Wall of Water": SpellEnrichers.WallOfWater,
    "Warding Bond": SpellEnrichers.WardingBond,
    "Wind Wall": SpellEnrichers.WindWall,
    "Witch Bolt": SpellEnrichers.WitchBolt,
    "Feather Fall": SpellEnrichers.FeatherFall,
  };

}
