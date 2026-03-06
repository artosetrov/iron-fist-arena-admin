'use server'

import { prisma } from '@/lib/prisma'

export async function searchPlayers(query: string, page: number = 1) {
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where = query
    ? {
        OR: [
          { username: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        gems: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        isBanned: true,
        banReason: true,
        _count: { select: { characters: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: users.map(u => ({
      ...u,
      characterCount: u._count.characters,
      _count: undefined,
    })),
    total,
    page,
    pageSize,
  }
}

export async function getPlayerDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      characters: {
        include: {
          equipment: {
            include: { item: true },
          },
          consumables: true,
          achievements: true,
        },
      },
    },
  })

  if (!user) throw new Error('User not found')

  return user
}

export async function banPlayer(userId: string, reason: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, banReason: reason },
  })
  return { success: true }
}

export async function unbanPlayer(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, banReason: null },
  })
  return { success: true }
}

export async function grantGold(characterId: string, amount: number) {
  if (amount <= 0) throw new Error('Amount must be positive')
  await prisma.character.update({
    where: { id: characterId },
    data: { gold: { increment: amount } },
  })
  return { success: true }
}

export async function grantGems(userId: string, amount: number) {
  if (amount <= 0) throw new Error('Amount must be positive')
  await prisma.user.update({
    where: { id: userId },
    data: { gems: { increment: amount } },
  })
  return { success: true }
}

export async function grantItem(characterId: string, itemId: string) {
  await prisma.equipmentInventory.create({
    data: {
      characterId,
      itemId,
    },
  })
  return { success: true }
}

export async function resetInventory(characterId: string) {
  await prisma.equipmentInventory.deleteMany({
    where: { characterId },
  })
  return { success: true }
}
