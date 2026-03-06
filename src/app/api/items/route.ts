import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = await prisma.item.create({
      data: {
        catalogId: body.catalogId,
        itemName: body.itemName,
        itemType: body.itemType,
        rarity: body.rarity,
        itemLevel: body.itemLevel,
        baseStats: body.baseStats,
        specialEffect: body.specialEffect,
        uniquePassive: body.uniquePassive,
        classRestriction: body.classRestriction,
        setName: body.setName,
        buyPrice: body.buyPrice,
        sellPrice: body.sellPrice,
        description: body.description,
        imageUrl: body.imageUrl,
      },
    })
    return NextResponse.json(item)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create item'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const item = await prisma.item.update({
      where: { id },
      data: {
        catalogId: data.catalogId,
        itemName: data.itemName,
        itemType: data.itemType,
        rarity: data.rarity,
        itemLevel: data.itemLevel,
        baseStats: data.baseStats,
        specialEffect: data.specialEffect,
        uniquePassive: data.uniquePassive,
        classRestriction: data.classRestriction,
        setName: data.setName,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    })
    return NextResponse.json(item)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update item'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    await prisma.item.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete item'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
