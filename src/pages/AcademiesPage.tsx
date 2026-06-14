import { useEffect, useMemo, useState } from 'react'
import { Building2, Edit2, Plus, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AcademiesPage() {
  const [academies, setAcademies] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedAcademy, setSelectedAcademy] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    localizacao: '',
    telefone: '',
    status: 'ativa',
  })

  useEffect(() => {
    loadAcademies()
  }, [])

  const loadAcademies = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('academias')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar academias:', error)
      alert('Erro ao carregar academias: ' + error.message)
      setLoading(false)
      return
    }

    setAcademies(data || [])
    setLoading(false)
  }

  const filteredAcademies = useMemo(() => {
    return academies.filter((academy) => {
      const text = `${academy.nome || ''} ${academy.localizacao || ''}`.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [academies, search])

  const openCreateModal = () => {
    setSelectedAcademy(null)
    setFormData({
      nome: '',
      localizacao: '',
      telefone: '',
      status: 'ativa',
    })
    setShowModal(true)
  }

  const openEditModal = (academy: any) => {
    setSelectedAcademy(academy)
    setFormData({
      nome: academy.nome || '',
      localizacao: academy.localizacao || '',
      telefone: academy.telefone || '',
      status: academy.status || 'ativa',
    })
    setShowModal(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (saving) return

    if (!formData.nome.trim()) {
      alert('Informe o nome da academia.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        nome: formData.nome.trim(),
        localizacao: formData.localizacao.trim(),
        telefone: formData.telefone.trim(),
        status: formData.status,
      }

      const result = selectedAcademy
        ? await supabase.from('academias').update(payload).eq('id', selectedAcademy.id)
        : await supabase.from('academias').insert([payload])

      if (result.error) {
        alert('Erro ao salvar academia: ' + result.error.message)
        return
      }

      setShowModal(false)
      setSelectedAcademy(null)
      await loadAcademies()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Academias</h1>
          <p className="text-muted-foreground">
            Crie academias e organize treinadores e atletas por unidade.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity neon-glow"
        >
          <Plus className="h-5 w-5" />
          Nova Academia
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome ou localização..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando academias...</div>
        ) : filteredAcademies.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma academia encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Academia</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Localização</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredAcademies.map((academy) => (
                  <tr key={academy.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{academy.nome}</p>
                          <p className="text-xs text-muted-foreground">ID {academy.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{academy.localizacao || '-'}</td>
                    <td className="p-4 text-sm text-foreground">{academy.telefone || '-'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium text-primary bg-primary/10">
                        {academy.status === 'ativa' ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditModal(academy)}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {selectedAcademy ? 'Editar Academia' : 'Nova Academia'}
              </h2>

              <button
                disabled={saving}
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                  required
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Localização</label>
                <input
                  type="text"
                  value={formData.localizacao}
                  onChange={(event) => setFormData({ ...formData, localizacao: event.target.value })}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Telefone</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(event) => setFormData({ ...formData, telefone: event.target.value })}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'A guardar...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
