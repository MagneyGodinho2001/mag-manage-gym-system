import { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/utils'
import { Search, Package, ShoppingBag, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
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
  const [produtosSupabase, setProdutosSupabase] = useState<any[]>([])
  const [, setLoadingProdutos] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('todas')

  useEffect(() => {
  buscarProdutos()
}, [])

async function buscarProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.log('Erro ao buscar produtos:', error)
  } else {
    console.log('Produtos do Supabase:', data)
    setProdutosSupabase(data || [])
  }

  setLoadingProdutos(false)
}

  // Filter only items available for sale (equipamento, uniforme, suplemento)
  const availableCategories = ['equipamento', 'uniforme', 'suplemento']

  const availableItems = produtosSupabase.filter((item: any) =>
  availableCategories.includes(item.categoria) && Number(item.quantidade || 0) > 0
)

  const filteredItems = availableItems.filter((item: any) => {
  const matchesSearch = item.nome?.toLowerCase().includes(search.toLowerCase())
  const matchesCategory = categoryFilter === 'todas' || item.categoria === categoryFilter
  return matchesSearch && matchesCategory
})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('productsTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('productsAvailableSubtitle')}</p>
      </div>

      {/* Filters */}
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

      {/* Products Grid */}
      {filteredItems.length === 0 ? (
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
              {/* Product Image */}
              <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
                {item.imagem_url ? (
                  <img
                    src={item.imagem_url}
                    alt={item.nome}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-2">{item.nome}</h3>
                </div>
                
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[item.categoria]}`}>
                  {categoryLabels[item.categoria]}
                </span>
                
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xl font-bold text-primary">{formatCurrency(item.preco)}</span>
                  <span className={`text-sm ${item.quantidade <= 5 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {item.quantidade} {'unidade'}(s)
                  </span>
                </div>
                
                {item.quantidade <= 5 && (
                  <p className="text-xs text-amber-500">{t('limitedStock')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShoppingBag className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">{t('howToBuyProducts')}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {t('buyProductsHelp')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
