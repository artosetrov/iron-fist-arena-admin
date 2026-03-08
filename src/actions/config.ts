'use server'

import { prisma } from '@/lib/prisma'
import { getAdminUser } from '@/lib/auth'

export async function getAllConfigs() {
  const admin = await getAdminUser()
  if (!admin) throw new Error('Unauthorized')
  return prisma.gameConfig.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  })
}

export async function getConfig(key: string) {
  const config = await prisma.gameConfig.findUnique({ where: { key } })
  return config?.value ?? null
}

export async function updateConfig(key: string, value: unknown, adminId: string) {
  const config = await prisma.gameConfig.upsert({
    where: { key },
    update: {
      value: value as never,
      updatedBy: adminId,
    },
    create: {
      key,
      value: value as never,
      category: 'general',
      updatedBy: adminId,
    },
  })

  await prisma.adminLog.create({
    data: {
      adminId,
      action: 'update_config',
      target: key,
      details: { value } as never,
    },
  })

  return config
}

export async function deleteConfig(key: string) {
  const admin = await getAdminUser()
  if (!admin) throw new Error('Unauthorized')
  await prisma.gameConfig.delete({ where: { key } })
  return { success: true }
}

export async function seedDefaultConfigs() {
  const admin = await getAdminUser()
  if (!admin) throw new Error('Unauthorized')
  const defaults: { key: string; value: unknown; category: string; description: string }[] = [
    // Stamina
    { key: 'stamina.max', value: 120, category: 'stamina', description: 'Maximum stamina capacity' },
    { key: 'stamina.regen_rate', value: 1, category: 'stamina', description: 'Stamina points regenerated per tick' },
    { key: 'stamina.regen_interval_minutes', value: 8, category: 'stamina', description: 'Minutes between stamina regeneration ticks' },
    { key: 'stamina.pvp_cost', value: 10, category: 'stamina', description: 'Stamina cost per PvP match' },
    { key: 'stamina.dungeon_easy', value: 15, category: 'stamina', description: 'Stamina cost for easy dungeon' },
    { key: 'stamina.dungeon_normal', value: 20, category: 'stamina', description: 'Stamina cost for normal dungeon' },
    { key: 'stamina.dungeon_hard', value: 25, category: 'stamina', description: 'Stamina cost for hard dungeon' },
    { key: 'stamina.boss', value: 40, category: 'stamina', description: 'Stamina cost for boss fight' },
    { key: 'stamina.training', value: 5, category: 'stamina', description: 'Stamina cost per training session' },
    { key: 'stamina.free_pvp_per_day', value: 3, category: 'stamina', description: 'Free PvP matches per day (no stamina cost)' },

    // Gold Rewards
    { key: 'gold_rewards.pvp_win_base', value: 100, category: 'gold_rewards', description: 'Base gold reward for PvP win' },
    { key: 'gold_rewards.pvp_loss_base', value: 30, category: 'gold_rewards', description: 'Base gold reward for PvP loss' },
    { key: 'gold_rewards.training_win', value: 50, category: 'gold_rewards', description: 'Gold reward for training win' },
    { key: 'gold_rewards.training_loss', value: 20, category: 'gold_rewards', description: 'Gold reward for training loss' },
    { key: 'gold_rewards.revenge_multiplier', value: 1.5, category: 'gold_rewards', description: 'Multiplier for revenge match gold rewards' },

    // XP Rewards
    { key: 'xp_rewards.pvp_win_xp', value: 80, category: 'xp_rewards', description: 'XP reward for PvP win' },
    { key: 'xp_rewards.pvp_loss_xp', value: 20, category: 'xp_rewards', description: 'XP reward for PvP loss' },
    { key: 'xp_rewards.training_win_xp', value: 40, category: 'xp_rewards', description: 'XP reward for training win' },
    { key: 'xp_rewards.training_loss_xp', value: 10, category: 'xp_rewards', description: 'XP reward for training loss' },

    // First Win Bonus
    { key: 'first_win_bonus.gold_mult', value: 2, category: 'first_win_bonus', description: 'Gold multiplier for first win of the day' },
    { key: 'first_win_bonus.xp_mult', value: 2, category: 'first_win_bonus', description: 'XP multiplier for first win of the day' },

    // Drop Chances
    { key: 'drop_chances.pvp', value: 0.15, category: 'drop_chances', description: 'Item drop chance from PvP matches' },
    { key: 'drop_chances.training', value: 0.05, category: 'drop_chances', description: 'Item drop chance from training' },
    { key: 'drop_chances.dungeon_easy', value: 0.20, category: 'drop_chances', description: 'Item drop chance from easy dungeons' },
    { key: 'drop_chances.dungeon_normal', value: 0.30, category: 'drop_chances', description: 'Item drop chance from normal dungeons' },
    { key: 'drop_chances.dungeon_hard', value: 0.40, category: 'drop_chances', description: 'Item drop chance from hard dungeons' },
    { key: 'drop_chances.boss', value: 0.75, category: 'drop_chances', description: 'Item drop chance from boss fights' },

    // Rarity Distribution
    { key: 'rarity_distribution.common', value: 50, category: 'rarity_distribution', description: 'Common item drop weight (%)' },
    { key: 'rarity_distribution.uncommon', value: 30, category: 'rarity_distribution', description: 'Uncommon item drop weight (%)' },
    { key: 'rarity_distribution.rare', value: 15, category: 'rarity_distribution', description: 'Rare item drop weight (%)' },
    { key: 'rarity_distribution.epic', value: 4, category: 'rarity_distribution', description: 'Epic item drop weight (%)' },
    { key: 'rarity_distribution.legendary', value: 1, category: 'rarity_distribution', description: 'Legendary item drop weight (%)' },

    // ELO
    { key: 'elo.k_calibration', value: 48, category: 'elo', description: 'K-factor for calibration matches (higher = more volatile)' },
    { key: 'elo.k_default', value: 32, category: 'elo', description: 'K-factor for regular matches' },
    { key: 'elo.calibration_games', value: 10, category: 'elo', description: 'Number of calibration games before stable rating' },
    { key: 'elo.min_rating', value: 0, category: 'elo', description: 'Minimum possible ELO rating' },

    // Combat
    { key: 'combat.max_turns', value: 15, category: 'combat', description: 'Maximum turns per combat encounter' },
    { key: 'combat.min_damage', value: 1, category: 'combat', description: 'Minimum damage dealt per attack' },
    { key: 'combat.crit_multiplier', value: 1.5, category: 'combat', description: 'Critical hit damage multiplier' },
    { key: 'combat.max_crit_chance', value: 50, category: 'combat', description: 'Maximum critical hit chance (%)' },

    // Prestige
    { key: 'prestige.max_level', value: 50, category: 'prestige', description: 'Maximum character level before prestige' },
    { key: 'prestige.stat_bonus_per_prestige', value: 0.05, category: 'prestige', description: 'Stat bonus per prestige level (5% each)' },
    { key: 'prestige.stat_points_per_level', value: 3, category: 'prestige', description: 'Stat points awarded per level up' },

    // Upgrade Chances
    { key: 'upgrade_chances', value: [100, 100, 100, 100, 100, 80, 60, 40, 25, 15], category: 'upgrade', description: 'Success rate (%) for each upgrade level (+1 through +10)' },

    // Battle Pass
    { key: 'battle_pass.bp_xp_per_pvp', value: 20, category: 'battle_pass', description: 'Battle Pass XP earned per PvP match' },
    { key: 'battle_pass.bp_xp_per_dungeon_floor', value: 30, category: 'battle_pass', description: 'Battle Pass XP earned per dungeon floor cleared' },
    { key: 'battle_pass.bp_xp_per_quest', value: 50, category: 'battle_pass', description: 'Battle Pass XP earned per daily quest completed' },
    { key: 'battle_pass.bp_xp_per_achievement', value: 100, category: 'battle_pass', description: 'Battle Pass XP earned per achievement completed' },
  ]

  let created = 0
  let skipped = 0

  for (const cfg of defaults) {
    const existing = await prisma.gameConfig.findUnique({ where: { key: cfg.key } })
    if (existing) {
      skipped++
      continue
    }
    await prisma.gameConfig.create({
      data: {
        key: cfg.key,
        value: cfg.value as never,
        category: cfg.category,
        description: cfg.description,
      },
    })
    created++
  }

  return { created, skipped, total: defaults.length }
}
