import { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/utils'
import {
  Search,
  Package,
  ShoppingBag,
  Filter,
  X,
  Eye,
  CreditCard,
  Upload,
  ShoppingCart,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
import { uploadImageFile } from '../lib/uploadImage'
import { useStore } from '../store/useStore'

const categoryLabels: Record<string, string> = {
  equipamento: 'Equipamento',
  uniforme: 'Uniforme',
  suplemento: 'Suplemento',
  limpeza: 'Limpeza',
  outro: 'Outro',
}

const categoryColors: Record<string, string> = {
  equipamento: 'bg-blue-500/20 text-blue-400',
  uniforme: 'bg-purple-500/20 text-purple-400',
  suplemento: 'bg-green-500/20 text-green-400',
  limpeza: 'bg-amber-500/20 text-amber-400',
  outro: 'bg-gray-500/20 text-gray-400',
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const { user } = useStore()
  const [produtosSupabase, setProdutosSupabase] = useState<any[]>([])
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('todas')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [purchaseProduct, setPurchaseProduct] = useState<any | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState('')

  useEffect(() => {
    buscarProdutos()
    buscarPedidos()
  }, [])

  async function buscarProdutos() {
    setLoadingProdutos(true)

    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.log('Erro ao buscar produtos:', error)
    } else {
      setProdutosSupabase(data || [])
    }

    setLoadingProdutos(false)
  }

  async function buscarPedidos() {
    if (!user?.email) return

    const { data, error } = await supabase
      .from('pedidos_produtos')
      .select('*')
      .eq('atleta_email', user.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao buscar pedidos de produtos:', error)
      return
    }

    setPedidos(data || [])
  }

  const availableCategories = ['equipamento', 'uniforme', 'suplemento']

  const availableItems = produtosSupabase.filter((item: any) =>
    availableCategories.includes(item.categoria) && Number(item.quantidade || 0) > 0
  )

  const filteredItems = availableItems.filter((item: any) => {
    const matchesSearch = item.nome?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'todas' || item.categoria === categoryFilter
    return matchesSearch && matchesCategory
  })

  const openPurchase = (product: any) => {
    setPurchaseProduct(product)
    setQuantity(1)
    setProofFile(null)
    setProofPreview('')
  }

  const closePurchase = () => {
    if (savingOrder) return
    setPurchaseProduct(null)
    setProofFile(null)
    setProofPreview('')
    setQuantity(1)
  }

  const submitPurchase = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!purchaseProduct || !user) return

    if (!proofFile) {
      alert('Envie o comprovativo do pagamento para concluir o pedido.')
      return
    }

    const productStock = Number(purchaseProduct.quantidade || 0)
    const orderQuantity = Math.max(1, Number(quantity || 1))

    if (orderQuantity > productStock) {
      alert('A quantidade pedida é maior do que o stock disponível.')
      return
    }

    try {
      setSavingOrder(true)

      const comprovativoUrl = await uploadImageFile(proofFile, 'comprovativos-produtos')
      const valorTotal = Number(purchaseProduct.preco || 0) * orderQuantity

      const { error } = await supabase.from('pedidos_produtos').insert([
        {
          atleta_id: Number.isFinite(Number(user.id)) ? Number(user.id) : null,
          atleta_nome: user.name,
          atleta_email: user.email,
          produto_id: Number(purchaseProduct.id),
          produto_nome: purchaseProduct.nome,
          quantidade: orderQuantity,
          preco_unitario: Number(purchaseProduct.preco || 0),
          valor_total: valorTotal,
          comprovativo_url: comprovativoUrl,
          status: 'pendente',
        },
      ])

      if (error) {
        alert('Erro ao enviar pedido: ' + error.message)
        return
      }

      const { data: gestores, error: gestoresError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('role', 'gestor')

      if (!gestoresError && gestores?.length) {
        await supabase.from('notifications').insert(
          gestores.map((gestor: any) => ({
            id: crypto.randomUUID(),
            user_id: String(gestor.id),
            title: 'Novo pedido de produto',
            message: `${user.name} enviou um pedido de ${orderQuantity} unidade(s) de ${purchaseProduct.nome}. Verifique o comprovativo em Stock.`,
            type: 'info',
            read: false,
          }))
        )
      }

      await buscarPedidos()
      closePurchase()
      alert('Pedido enviado com sucesso. Aguarde a confirmação do gestor.')
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar pedido.')
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('productsTitle')}</h1>
        <p className="text-muted-foreground mt-1">
          Visualize produtos, faça pedidos e envie o comprovativo do pagamento.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchProducts')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="todas">{t('allCategories')}</option>
            <option value="equipamento">Equipamentos</option>
            <option value="uniforme">Uniformes</option>
            <option value="suplemento">Suplementos</option>
          </select>
        </div>
      </div>

      {loadingProdutos ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Package className="h-12 w-12 mb-4 opacity-50" />
          <p>A carregar produtos...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">{t('noProductFound')}</h3>
          <p className="text-muted-foreground">{t('adjustFilters')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => setSelectedProduct(item)}
                className="h-40 w-full bg-muted flex items-center justify-center overflow-hidden group"
                title="Ver produto"
              >
                {item.imagem_url ? (
                  <img
                    src={item.imagem_url}
                    alt={item.nome}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
                )}
              </button>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-2">{item.nome}</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(item)}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[item.categoria] || categoryColors.outro}`}>
                  {categoryLabels[item.categoria] || 'Outro'}
                </span>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xl font-bold text-primary">{formatCurrency(item.preco)}</span>
                  <span className={`text-sm ${item.quantidade <= 5 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {item.quantidade} unidade(s)
                  </span>
                </div>

                {item.quantidade <= 5 && (
                  <p className="text-xs text-amber-500">{t('limitedStock')}</p>
                )}

                <button
                  type="button"
                  onClick={() => openPurchase(item)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">Minhas compras</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe os pedidos enviados e o estado de aprovação do pagamento.
            </p>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não enviaste pedidos de produtos.</p>
        ) : (
          <div className="space-y-2">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{pedido.produto_nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {pedido.quantidade} unidade(s) · {formatCurrency(pedido.valor_total)}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {pedido.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuy={() => {
            openPurchase(selectedProduct)
            setSelectedProduct(null)
          }}
        />
      )}

      {purchaseProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={closePurchase} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-lg font-semibold text-foreground">Comprar produto</h2>
              <button type="button" onClick={closePurchase} disabled={savingOrder} className="rounded-lg p-2 hover:bg-secondary disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitPurchase} className="space-y-4 p-5">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="font-medium text-foreground">{purchaseProduct.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Preço: {formatCurrency(purchaseProduct.preco)} · Stock: {purchaseProduct.quantidade}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Quantidade</label>
                <input
                  type="number"
                  min={1}
                  max={Number(purchaseProduct.quantidade || 1)}
                  value={quantity}
                  disabled={savingOrder}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="text-sm text-muted-foreground">Total a pagar</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(purchaseProduct.preco || 0) * Number(quantity || 1))}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Comprovativo do pagamento</label>
                <div className="flex gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                    {proofPreview ? (
                      <img src={proofPreview} alt="Comprovativo" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={savingOrder}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setProofFile(file)
                        setProofPreview(file ? URL.createObjectURL(file) : '')
                      }}
                      className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Envie uma imagem do comprovativo para o gestor confirmar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closePurchase} disabled={savingOrder} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-foreground hover:bg-secondary disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={savingOrder} className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {savingOrder ? 'A enviar...' : 'Enviar pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductDetailModal({
  product,
  onClose,
  onBuy,
}: {
  product: any
  onClose: () => void
  onBuy: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">{product.nome}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[260px_1fr]">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
            {product.imagem_url ? (
              <img src={product.imagem_url} alt={product.nome} className="h-full w-full object-cover" />
            ) : (
              <ShoppingBag className="h-20 w-20 text-muted-foreground/50" />
            )}
          </div>

          <div className="space-y-4">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[product.categoria] || categoryColors.outro}`}>
              {categoryLabels[product.categoria] || 'Outro'}
            </span>

            <div>
              <p className="text-sm text-muted-foreground">Preço</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(product.preco)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Disponibilidade</p>
              <p className="font-medium text-foreground">{product.quantidade} unidade(s) em stock</p>
            </div>

            {product.fornecedor && (
              <div>
                <p className="text-sm text-muted-foreground">Fornecedor</p>
                <p className="font-medium text-foreground">{product.fornecedor}</p>
              </div>
            )}

            <button
              type="button"
              onClick={onBuy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="h-4 w-4" />
              Comprar este produto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
