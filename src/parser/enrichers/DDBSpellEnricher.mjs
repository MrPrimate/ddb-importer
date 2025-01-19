import { SpellEnrichers } from "./_module.mjs";
import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";

export default class DDBSpellEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null } = {}) {
    super({
      activityGenerator,
      effectType: "spell",
      enricherType: "spell",
      notifier,
      ddbActionType: "spell",
    });
  }

  NAME_HINTS_2014 = {};

  NAME_HINTS = {
    "Bigby's Hand": "Arcane Hand",
    "Melf's Acid Arrow": "Acid Arrow",
    "Mordenkainen's Sword": "Arcane Sword",
    "Evard's Black Tentacles": "Black Tentacles",
    "Otiluke's Resilient Sphere": "Resilient Sphere",
    "Otto's Irresistible Dance": "Irresistible Dance",
    "Tasha's Hideous Laughter": "Hideous Laughter",
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
    "Banishing Smite": SpellEnrichers.BanishingSmite,
    "Banishment": SpellEnrichers.Banishment,
    "Barkskin": SpellEnrichers.Barkskin,
    "Beacon of Hope": SpellEnrichers.BeaconOfHope,
    "Blade Ward": SpellEnrichers.BladeWard,
    "Bless": SpellEnrichers.Bless,
    "Blur": SpellEnrichers.Blur,
    "Bones of the Earth": SpellEnrichers.BonesOfTheEarth,
    "Booming Blade": SpellEnrichers.BoomingBlade,
    "Branding Smite": SpellEnrichers.BrandingSmite,
    "Call Lightning": SpellEnrichers.CallLightning,
    "Catapult": SpellEnrichers.Catapult,
    "Chaos Bolt": SpellEnrichers.ChaosBolt,
    "Chill Touch": SpellEnrichers.ChillTouch,
    "Chromatic Orb": SpellEnrichers.ChromaticOrb,
    "Cloudkill": SpellEnrichers.Cloudkill,
    "Color Spray": SpellEnrichers.ColorSpray,
    "Command": SpellEnrichers.Command,
    "Comprehend Languages": SpellEnrichers.ComprehendLanguages,
    "Control Weather": SpellEnrichers.ControlWeather,
    "Counterspell": SpellEnrichers.Counterspell,
    "Create Bonfire": SpellEnrichers.CreateBonfire,
    "Crown of Madness": SpellEnrichers.CrownOfMadness,
    "Dancing Lights": SpellEnrichers.DancingLights,
    "Darkness": SpellEnrichers.Darkness,
    "Darkvision": SpellEnrichers.Darkvision,
    "Divine Favor": SpellEnrichers.DivineFavor,
    "Divine Smite": SpellEnrichers.DivineSmite,
    "Dragon's Breath": SpellEnrichers.DragonsBreath,
    "Eldritch Blast": SpellEnrichers.EldritchBlast,
    "Elemental Weapon": SpellEnrichers.ElementalWeapon,
    "Enhance Ability": SpellEnrichers.EnhanceAbility,
    "Enlarge/Reduce": SpellEnrichers.EnlargeReduce,
    "Ensnaring Strike": SpellEnrichers.EnsnaringStrike,
    "Entangle": SpellEnrichers.Entangle,
    "Faerie Fire": SpellEnrichers.FaerieFire,
    "False Life": SpellEnrichers.FalseLife,
    "Feather Fall": SpellEnrichers.FeatherFall,
    "Feeblemind": SpellEnrichers.Feeblemind,
    "Fire Shield": SpellEnrichers.FireShield,
    "Flame Blade": SpellEnrichers.FlameBlade,
    "Flaming Sphere": SpellEnrichers.FlamingSphere,
    "Flesh to Stone": SpellEnrichers.FleshToStone,
    "Fly": SpellEnrichers.Fly,
    "Fount of Moonlight": SpellEnrichers.FountOfMoonlight,
    "Frostbite": SpellEnrichers.Frostbite,
    "Glyph of Warding": SpellEnrichers.GlyphOfWarding,
    "Grease": SpellEnrichers.Grease,
    "Green-Flame Blade": SpellEnrichers.GreenFlameBlade,
    "Guidance": SpellEnrichers.Guidance,
    "Guiding Bolt": SpellEnrichers.GuidingBolt,
    "Gust of Wind": SpellEnrichers.GustOfWind,
    "Hail of Thorns": SpellEnrichers.HailOfThorns,
    "Haste": SpellEnrichers.Haste,
    "Heat Metal": SpellEnrichers.HeatMetal,
    "Heroes' Feast": SpellEnrichers.HeroesFeast,
    "Heroism": SpellEnrichers.Heroism,
    "Hex": SpellEnrichers.Hex,
    "Hideous Laughter": SpellEnrichers.HideousLaughter,
    "Hold Monster": SpellEnrichers.HoldThing,
    "Hold Person": SpellEnrichers.HoldThing,
    "Holy Aura": SpellEnrichers.HolyAura,
    "Hunger of Hadar": SpellEnrichers.HungerOfHadar,
    "Hunter's Mark": SpellEnrichers.HuntersMark,
    "Ice Knife": SpellEnrichers.IceKnife,
    "Incendiary Cloud": SpellEnrichers.IncendiaryCloud,
    "Insect Plague": SpellEnrichers.InsectPlague,
    "Invisibility": SpellEnrichers.Invisibility,
    "Irresistible Dance": SpellEnrichers.IrresistibleDance,
    "Jallarzi's Storm of Radiance": SpellEnrichers.JallarzisStormOfRadiance,
    "Light": SpellEnrichers.Light,
    "Longstrider": SpellEnrichers.Longstrider,
    "Mage Armor": SpellEnrichers.MageArmor,
    "Mage Hand": SpellEnrichers.MageHand,
    "Magic Weapon": SpellEnrichers.MagicWeapon,
    "Mass Suggestion": SpellEnrichers.MassSuggestion,
    "Mind Blank": SpellEnrichers.MindBlank,
    "Mirror Image": SpellEnrichers.MirrorImage,
    "Misty Step": SpellEnrichers.MistyStep,
    "Pass Without Trace": SpellEnrichers.PassWithoutTrace,
    "Polymorph": SpellEnrichers.Polymorph,
    "Power Word Fortify": SpellEnrichers.PowerWordFortify,
    "Primal Savagery": SpellEnrichers.PrimalSavagery,
    "Prismatic Wall": SpellEnrichers.PrismaticWall,
    "Produce Flame": SpellEnrichers.ProduceFlame,
    "Protection from Energy": SpellEnrichers.ProtectionFromEnergy,
    "Protection from Poison": SpellEnrichers.ProtectionFromPoison,
    "Psychic Scream": SpellEnrichers.PsychicScream,
    "Pyrotechnics": SpellEnrichers.Pyrotechnics,
    "Ray of Enfeeblement": SpellEnrichers.RayOfEnfeeblement,
    "Ray of Frost": SpellEnrichers.RayOfFrost,
    "Ray of Sickness": SpellEnrichers.RayOfSickness,
    "Regenerate": SpellEnrichers.Regenerate,
    "Resilient Sphere": SpellEnrichers.ResilientSphere,
    "Resistance": SpellEnrichers.Resistance,
    "Scorching Ray": SpellEnrichers.ScorchingRay,
    "Searing Smite": SpellEnrichers.SearingSmite,
    "Shadow Blade": SpellEnrichers.ShadowBlade,
    "Shield of Faith": SpellEnrichers.ShieldOfFaith,
    "Shield": SpellEnrichers.Shield,
    "Shillelagh": SpellEnrichers.Shillelagh,
    "Shining Smite": SpellEnrichers.ShiningSmite,
    "Silence": SpellEnrichers.Silence,
    "Sleep": SpellEnrichers.Sleep,
    "Slow": SpellEnrichers.Slow,
    "Sorcerous Burst": SpellEnrichers.SorcerousBurst,
    "Spider Climb": SpellEnrichers.SpiderClimb,
    "Spike Growth": SpellEnrichers.SpikeGrowth,
    "Spirit Guardians": SpellEnrichers.SpiritGuardians,
    "Spirit Shroud": SpellEnrichers.SpiritShroud,
    "Spiritual Weapon": SpellEnrichers.SpiritualWeapon,
    "Stoneskin": SpellEnrichers.Stoneskin,
    "Storm Sphere": SpellEnrichers.StormSphere,
    "Suggestion": SpellEnrichers.Suggestion,
    "Sword Burst": SpellEnrichers.SwordBurst,
    "Synaptic Static": SpellEnrichers.SynapticStatic,
    "Tasha's Bubbling Cauldron": SpellEnrichers.TashasBubblingCauldron,
    "Tasha's Caustic Brew": SpellEnrichers.TashasCausticBrew,
    "Thunder Step": SpellEnrichers.ThunderStep,
    "Thunderclap": SpellEnrichers.Thunderclap,
    "Thunderous Smite": SpellEnrichers.ThunderousSmite,
    "Tidal Wave": SpellEnrichers.TidalWave,
    "Toll the Dead": SpellEnrichers.TollTheDead,
    "True Strike": SpellEnrichers.TrueStrike,
    "Vicious Mockery": SpellEnrichers.ViciousMockery,
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
    "Web": SpellEnrichers.Web,
    "Wind Wall": SpellEnrichers.WindWall,
    "Witch Bolt": SpellEnrichers.WitchBolt,
    "Zephyr Strike": SpellEnrichers.ZephyrStrike,
    "Blindness/Deafness": SpellEnrichers.BlindnessDeafness,
  };

}
