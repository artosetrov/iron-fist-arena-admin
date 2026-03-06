'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Trash2, Pencil } from 'lucide-react'

type Item = {
  id: string
  catalogId: string
  itemName: string
  itemType: string
  rarity: string
  itemLevel: number
  baseStats: unknown
  specialEffect: string | null
  uniquePassive: string | null
  classRestriction: string | null
  setName: string | null
  buyPrice: number
  sellPrice: number
  description: string | null
  imageUrl: string | null
}

const ITEM_TYPES = [
  'weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots',
  'accessory', 'amulet', 'belt', 'relic', 'necklace', 'ring',
]

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-zinc-600/20 text-zinc-400 border-zinc-600',
  uncommon: 'bg-green-600/20 text-green-400 border-green-600',
  rare: 'bg-blue-600/20 text-blue-400 border-blue-600',
  epic: 'bg-purple-600/20 text-purple-400 border-purple-600',
  legendary: 'bg-orange-600/20 text-orange-400 border-orange-600',
}

const emptyForm = {
  catalogId: '',
  itemName: '',
  itemType: 'weapon',
  rarity: 'common',
  itemLevel: 1,
  baseStats: '{}',
  specialEffect: '',
  uniquePassive: '',
  classRestriction: '',
  setName: '',
  buyPrice: 0,
  sellPrice: 0,
  description: '',
  imageUrl: '',
}

export function ItemsClient({ items }: { items: Item[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterRarity, setFilterRarity] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = useState<Item | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.itemName.toLowerCase().includes(search.toLowerCase())
      const matchesType = filterType === 'all' || item.itemType === filterType
      const matchesRarity = filterRarity === 'all' || item.rarity === filterRarity
      return matchesSearch && matchesType && matchesRarity
    })
  }, [items, search, filterType, filterRarity])

  function openCreate() {
    setEditingItem(null)
    setForm(emptyForm)
    setError('')
    setDialogOpen(true)
  }

  function openEdit(item: Item) {
    setEditingItem(item)
    setForm({
      catalogId: item.catalogId,
      itemName: item.itemName,
      itemType: item.itemType,
      rarity: item.rarity,
      itemLevel: item.itemLevel,
      baseStats: JSON.stringify(item.baseStats ?? {}, null, 2),
      specialEffect: item.specialEffect ?? '',
      uniquePassive: item.uniquePassive ?? '',
      classRestriction: item.classRestriction ?? '',
      setName: item.setName ?? '',
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
      description: item.description ?? '',
      imageUrl: item.imageUrl ?? '',
    })
    setError('')
    setDialogOpen(true)
  }

  function openDelete(item: Item) {
    setDeletingItem(item)
    setDeleteDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let parsedStats: unknown
    try {
      parsedStats = JSON.parse(form.baseStats || '{}')
    } catch {
      setError('Invalid JSON in Base Stats field')
      return
    }

    const body = {
      catalogId: form.catalogId,
      itemName: form.itemName,
      itemType: form.itemType,
      rarity: form.rarity,
      itemLevel: Number(form.itemLevel),
      baseStats: parsedStats,
      specialEffect: form.specialEffect || null,
      uniquePassive: form.uniquePassive || null,
      classRestriction: form.classRestriction || null,
      setName: form.setName || null,
      buyPrice: Number(form.buyPrice),
      sellPrice: Number(form.sellPrice),
      description: form.description || null,
      imageUrl: form.imageUrl || null,
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/items', {
          method: editingItem ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingItem ? { id: editingItem.id, ...body } : body),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to save item')
          return
        }
        setDialogOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save item')
      }
    })
  }

  async function handleDelete() {
    if (!deletingItem) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/items?id=${deletingItem.id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to delete item')
          return
        }
        setDeleteDialogOpen(false)
        setDeletingItem(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete')
      }
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Item Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ITEM_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRarity} onValueChange={setFilterRarity}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rarities</SelectItem>
            {RARITIES.map((r) => (
              <SelectItem key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Item
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rarity</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Level</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Buy Price</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sell Price</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => openEdit(item)}
                >
                  <td className="px-4 py-3 font-medium">{item.itemName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {item.itemType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={RARITY_COLORS[item.rarity] ?? ''}>
                      {item.rarity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{item.itemLevel}</td>
                  <td className="px-4 py-3">{item.buyPrice.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.sellPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(item)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDelete(item)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {items.length} items
      </p>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Create Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update item properties.' : 'Add a new item to the catalog.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="catalogId">Catalog ID</Label>
                <Input
                  id="catalogId"
                  value={form.catalogId}
                  onChange={(e) => setForm({ ...form, catalogId: e.target.value })}
                  placeholder="e.g. sword_iron_01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  placeholder="Iron Sword"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select value={form.itemType} onValueChange={(v) => setForm({ ...form, itemType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RARITIES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemLevel">Item Level</Label>
                <Input
                  id="itemLevel"
                  type="number"
                  min={1}
                  value={form.itemLevel}
                  onChange={(e) => setForm({ ...form, itemLevel: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyPrice">Buy Price</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  min={0}
                  value={form.buyPrice}
                  onChange={(e) => setForm({ ...form, buyPrice: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">Sell Price</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  min={0}
                  value={form.sellPrice}
                  onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseStats">Base Stats (JSON)</Label>
              <Textarea
                id="baseStats"
                value={form.baseStats}
                onChange={(e) => setForm({ ...form, baseStats: e.target.value })}
                placeholder='{"str": 5, "agi": 3}'
                className="font-mono text-xs"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialEffect">Special Effect</Label>
                <Input
                  id="specialEffect"
                  value={form.specialEffect}
                  onChange={(e) => setForm({ ...form, specialEffect: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uniquePassive">Unique Passive</Label>
                <Input
                  id="uniquePassive"
                  value={form.uniquePassive}
                  onChange={(e) => setForm({ ...form, uniquePassive: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classRestriction">Class Restriction</Label>
                <Input
                  id="classRestriction"
                  value={form.classRestriction}
                  onChange={(e) => setForm({ ...form, classRestriction: e.target.value })}
                  placeholder="warrior, mage, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setName">Set Name</Label>
                <Input
                  id="setName"
                  value={form.setName}
                  onChange={(e) => setForm({ ...form, setName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.itemName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
