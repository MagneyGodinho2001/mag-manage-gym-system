import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import type { StockItem } from '../types'
import {
  Package,
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  MoreVertical,
  History,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'

const categories = [
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'uniforme', label: 'Uniforme' },
  { value: 'suplemento', label: 'Suplemento' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'outro', label: 'Outro' },
]

export default function StockPage() {
  const { t } = useTranslation()
  const { user } = useStore()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [movimentosSupabase, setMovimentosSupabase] = useState<any[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  carregarProdutos()
  carregarMovimentos()
}, [])
const carregarMovimentos = async () => {
  const { data, error } = await supabase
    .from('movimentos_estoque')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar movimentos:', error)
    return
  }

  setMovimentosSupabase(data || [])
}

const carregarProdutos = async () => {
  setLoading(true)

  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.error('Erro ao buscar produtos:', error)
    setLoading(false)
    return
  }

  const produtosFormatados: StockItem[] = (data || []).map((item: any) => ({
    id: String(item.id),
    name: item.nome,
    category: item.categoria,
    quantity: Number(item.quantidade || 0),
    minQuantity: Number(item.quantidade_minima || 5),
    unit: item.unidade || 'unidade',
    price: Number(item.preco || 0),
    supplier: item.fornecedor || '',
    imageUrl: item.imagem_url || '',
    createdAt: item.created_at,
  }))

  setStockItems(produtosFormatados)
  setLoading(false)
}

  const canEdit = user?.role === 'gestor'

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !filterCategory || item.category === filterCategory
      const matchesLowStock = !showLowStock || item.quantity <= item.minQuantity
      return matchesSearch && matchesCategory && matchesLowStock
    })
  }, [stockItems, search, filterCategory, showLowStock])

  const lowStockCount = useMemo(() => {
    return stockItems.filter((i) => i.quantity <= i.minQuantity).length
  }, [stockItems])

  const handleAdd = () => {
    setSelectedItem(null)
    setShowModal(true)
  }

  const handleEdit = (item: StockItem) => {
    setSelectedItem(item)
    setShowModal(true)
    setActiveDropdown(null)
  }

  const handleDelete = (item: StockItem) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
    setActiveDropdown(null)
  }

  const handleMovement = (item: StockItem, type: 'entrada' | 'saida') => {
    setSelectedItem(item)
    setMovementType(type)
    setShowMovementModal(true)
    setActiveDropdown(null)
  }

  const handleHistory = (item: StockItem) => {
    setSelectedItem(item)
    setShowHistoryModal(true)
    setActiveDropdown(null)
  }

 const confirmDelete = async () => {
  if (!selectedItem) return

  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', selectedItem.id)

  if (error) {
    console.error('Erro ao excluir produto:', error)
    return
  }

  await carregarProdutos()
  setShowDeleteModal(false)
  setSelectedItem(null)
}

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('stockTitle')}</h1>
<p className="text-muted-foreground">
  {loading ? 'A carregar itens...' : `${stockItems.length} itens cadastrados`}
</p>
        </div>
        {canEdit && (
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity neon-glow"
          >
            <Plus className="h-5 w-5" />
            {t('newItem')}
          </button>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              {lowStockCount} {lowStockCount === 1 ? 'item precisa' : 'itens precisam'} ser {lowStockCount === 1 ? 'reabastecido' : 'reabastecidos'}
            </p>
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              showLowStock
                ? 'bg-destructive text-destructive-foreground'
                : 'text-destructive hover:bg-destructive/20'
            )}
          >
            {showLowStock ? t('viewAll') : t('viewLowStock')}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchItem')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Stock Table */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg">{t('noItemFound')}</p>
          <p className="text-sm">{t('adjustFilters')}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Categoria</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Quantidade</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Preço Unit.</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Fornecedor</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg',
                          item.quantity <= item.minQuantity ? 'bg-destructive/20' : 'bg-primary/20'
                        )}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <Package className={cn(
                              'h-5 w-5',
                              item.quantity <= item.minQuantity ? 'text-destructive' : 'text-primary'
                            )} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          {item.quantity <= item.minQuantity && (
                            <p className="text-xs text-destructive">{t('lowStockLabel')}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 bg-secondary rounded-full text-xs font-medium text-foreground">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        'font-medium',
                        item.quantity <= item.minQuantity ? 'text-destructive' : 'text-foreground'
                      )}>
                        {item.quantity} {item.unit}
                      </span>
                      <p className="text-xs text-muted-foreground">Min: {item.minQuantity}</p>
                    </td>
                    <td className="px-4 py-4 text-right text-foreground">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.supplier || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleMovement(item, 'entrada')}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                          title="Entrada"
                        >
                          <ArrowUpCircle className="h-4 w-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleMovement(item, 'saida')}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Saída"
                        >
                          <ArrowDownCircle className="h-4 w-4 text-destructive" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {activeDropdown === item.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveDropdown(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-popover border border-border rounded-lg shadow-lg py-1">
                                <button
                                  onClick={() => handleHistory(item)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                                >
                                  <History className="h-4 w-4" />
                                  Histórico
                                </button>
                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                      {t('edit')}
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t('delete')}
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

     {/* Add/Edit Modal */}
{showModal && (
  <StockItemModal
    item={selectedItem}
    onClose={() => {
      setShowModal(false)
      setSelectedItem(null)
    }}
    onSave={async (data) => {
      const produtoSupabase = {
        nome: data.name,
        categoria: data.category,
        quantidade: data.quantity,
        quantidade_minima: data.minQuantity,
        unidade: data.unit,
        preco: data.price,
        fornecedor: data.supplier,
        imagem_url: data.imageUrl,
      }

      if (selectedItem) {
        const { error } = await supabase
          .from('produtos')
          .update(produtoSupabase)
          .eq('id', Number(selectedItem.id))

        if (error) {
          console.error('Erro ao atualizar produto:', error)
          alert('Erro ao atualizar produto: ' + error.message)
          return
        }
      } else {
        const novoProduto = {
          id: Date.now(),
          ...produtoSupabase,
        }

        const { error } = await supabase
          .from('produtos')
          .insert([novoProduto])

        if (error) {
          console.error('Erro ao adicionar produto:', error)
          alert('Erro ao adicionar produto: ' + error.message)
          return
        }
      }

      await carregarProdutos()
      setShowModal(false)
      setSelectedItem(null)
    }}
  />
)}

      {/* Movement Modal */}
      {showMovementModal && selectedItem && (
        <MovementModal
          item={selectedItem}
          type={movementType}
          userId={user?.id || ''}
          onClose={() => {
            setShowMovementModal(false)
            setSelectedItem(null)
          }}
onSave={async (movement) => {
  if (!selectedItem) return

  const quantidadeAtual = Number(selectedItem.quantity || 0)
  const quantidadeMovimento = Number(movement.quantity || 0)

  const novaQuantidade =
    movement.type === 'entrada'
      ? quantidadeAtual + quantidadeMovimento
      : quantidadeAtual - quantidadeMovimento

  if (novaQuantidade < 0) {
    alert('Quantidade insuficiente em estoque.')
    return
  }

  const { error: erroProduto } = await supabase
    .from('produtos')
    .update({ quantidade: novaQuantidade })
    .eq('id', Number(selectedItem.id))

  if (erroProduto) {
    console.error('Erro ao atualizar estoque:', erroProduto)
    alert('Erro ao atualizar estoque: ' + erroProduto.message)
    return
  }

  const { error: erroMovimento } = await supabase
    .from('movimentos_estoque')
    .insert([
      {
        id: Date.now(),
        produto_id: Number(selectedItem.id),
        tipo: movement.type,
        quantidade: quantidadeMovimento,
        motivo: movement.reason,
      },
    ])

  if (erroMovimento) {
    console.error('Erro ao guardar movimento:', erroMovimento)
    alert('Estoque atualizado, mas erro ao guardar histórico: ' + erroMovimento.message)
    return
  }

  await carregarProdutos()
  setShowMovementModal(false)
  setSelectedItem(null)
}}
        />
      )}
{/* History Modal */}
{showHistoryModal && selectedItem && (
  <HistoryModal
    item={selectedItem}
    movements={movimentosSupabase
      .filter((m) => Number(m.produto_id) === Number(selectedItem.id))
      .map((m) => ({
        id: String(m.id),
        type: m.tipo,
        quantity: Number(m.quantidade || 0),
        reason: m.motivo || '',
        date: m.created_at,
      }))}
    onClose={() => {
      setShowHistoryModal(false)
      setSelectedItem(null)
    }}
  />
)}
    
        
      

      {/* Delete Confirmation */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('confirmDelete')}</h3>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja excluir <strong>{selectedItem.name}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StockItemModalProps {
  item: StockItem | null
  onClose: () => void
  onSave: (data: Partial<StockItem>) => void
}

function StockItemModal({ item, onClose, onSave }: StockItemModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || 'equipamento' as StockItem['category'],
    quantity: item?.quantity || 0,
    minQuantity: item?.minQuantity || 5,
    unit: item?.unit || 'unidade',
    price: item?.price || 0,
    supplier: item?.supplier || '',
    imageUrl: item?.imageUrl || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {item ? t('editItem') : t('newItem')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('itemName')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Imagem do produto</label>
            <div className="flex gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Pré-visualização do produto" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://exemplo.com/imagem-do-produto.jpg"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Cole aqui o link de uma imagem para aparecer no stock e no catálogo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as StockItem['category'] })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('unit')}</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="unidade, par, kg..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('quantity')}</label>
              <input
                type="number"
                required
                min={0}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('minQuantity')}</label>
              <input
                type="number"
                required
                min={0}
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('unitPrice')}</label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('supplier')}</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {item ? t('save') : t('register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface MovementModalProps {
  item: StockItem
  type: 'entrada' | 'saida'
  userId: string
  onClose: () => void
  onSave: (movement: { itemId: string; type: 'entrada' | 'saida'; quantity: number; reason: string; date: string; userId: string }) => void
}

function MovementModal({ item, type, userId, onClose, onSave }: MovementModalProps) {
  const { t } = useTranslation()
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      itemId: item.id,
      type,
      quantity,
      reason,
      date: new Date().toISOString().split('T')[0],
      userId,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {type === 'entrada' ? (
              <ArrowUpCircle className="h-6 w-6 text-primary" />
            ) : (
              <ArrowDownCircle className="h-6 w-6 text-destructive" />
            )}
            <h2 className="text-xl font-semibold text-foreground">
              {type === 'entrada' ? t('stockEntry') : t('stockExit')}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-sm text-muted-foreground">Estoque atual: {item.quantity} {item.unit}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('quantity')}</label>
            <input
              type="number"
              required
              min={1}
              max={type === 'saida' ? item.quantity : undefined}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('reason')}</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={type === 'entrada' ? 'Ex: Reposição de estoque' : 'Ex: Uso em treino'}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className={cn(
                'px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity',
                type === 'entrada'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-destructive text-destructive-foreground'
              )}
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface HistoryModalProps {
  item: StockItem
  movements: { id: string; type: 'entrada' | 'saida'; quantity: number; reason: string; date: string }[]
  onClose: () => void
}

function HistoryModal({ item, movements, onClose }: HistoryModalProps) {
  const { t } = useTranslation()
  const sortedMovements = [...movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t('history')}</h2>
            <p className="text-sm text-muted-foreground">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {sortedMovements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('noMovement')}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  {movement.type === 'entrada' ? (
                    <ArrowUpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {movement.type === 'entrada' ? '+' : '-'}{movement.quantity} {item.unit}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{movement.reason}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(movement.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
