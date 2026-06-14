import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate } from '../lib/utils'
import {
  Search,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  X,
  Upload,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'

const statusLabels = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
}

const statusColors = {
  pago: 'bg-green-500/20 text-green-400',
  pendente: 'bg-amber-500/20 text-amber-400',
  atrasado: 'bg-red-500/20 text-red-400',
}

const statusIcons = {
  pago: CheckCircle,
  pendente: Clock,
  atrasado: AlertTriangle,
}

export default function PaymentsPage() {
  const { t } = useTranslation()
  const { user, registeredUsers, addNotification } = useStore()

  const [pagamentosSupabase, setPagamentosSupabase] = useState<any[]>([])
  const [membrosSupabase, setMembrosSupabase] = useState<any[]>([])
  const [recibosSupabase, setRecibosSupabase] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    athleteId: '',
    amount: '150',
    dueDate: '',
    month: '',
    year: new Date().getFullYear().toString(),
  })

  const isAtleta = user?.role === 'atleta'
  const isGestor = user?.role === 'gestor'

  useEffect(() => {
    buscarPagamentos()
    buscarMembros()
    buscarRecibos()
  }, [])

  async function buscarMembros() {
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.log('Erro ao buscar membros:', error)
      return
    }

    setMembrosSupabase(data || [])
  }

  async function buscarPagamentos() {
    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.log('Erro ao buscar pagamentos:', error)
      return
    }

    setPagamentosSupabase(data || [])
  }

  async function buscarRecibos() {
    const { data, error } = await supabase
      .from('recibos_pagamentos')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.log('Erro ao buscar comprovativos:', error)
      return
    }

    setRecibosSupabase(data || [])
  }

const membroLogado = membrosSupabase.find((membro: any) =>
  membro.email?.toLowerCase() === user?.email?.toLowerCase() ||
  membro.nome?.toLowerCase() === user?.name?.toLowerCase()
)

  const getPaymentByReceipt = (recibo: any) => {
    const directPayment = pagamentosSupabase.find((payment: any) => {
      return String(payment.id) === String(recibo.pagamento_id)
    })

    if (directPayment) return directPayment

    return pagamentosSupabase
      .filter((payment: any) => {
        return (
          String(payment.membro_id) === String(recibo.membro_id) &&
          payment.status !== 'pago'
        )
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.data_pagamento || a.created_at || 0).getTime()
        const dateB = new Date(b.data_pagamento || b.created_at || 0).getTime()

        return dateB - dateA
      })[0]
  }

  const recibosParaAprovacao = recibosSupabase.filter((recibo: any) => {
    if (recibo.status === 'pendente') return true

    const payment = getPaymentByReceipt(recibo)

    return recibo.status === 'aprovado' && payment && payment.status !== 'pago'
  })

  const getMemberByReceipt = (recibo: any) =>
    membrosSupabase.find((membro: any) => {
      return String(membro.id) === String(recibo.membro_id)
    })

  const filteredPayments = pagamentosSupabase
    .filter((payment: any) => {
      const nome = payment.membro_nome || ''

      const matchesSearch = nome.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'todos' || payment.status === statusFilter

      const matchesUser = isAtleta
        ? Number(payment.membro_id) === Number(membroLogado?.id)
        : true

      return matchesSearch && matchesStatus && matchesUser
    })
    .sort((a, b) => {
      const dataA = new Date(a.data_pagamento || a.created_at).getTime()
      const dataB = new Date(b.data_pagamento || b.created_at).getTime()

      return dataB - dataA
    })

  const pagamentosDoAtleta = filteredPayments

  const pagamentosPendentesOuAtrasados = pagamentosDoAtleta.filter(
    (p: any) => p.status === 'pendente' || p.status === 'atrasado'
  )

  const stats = {
    total: pagamentosSupabase.length,
    paid: pagamentosSupabase.filter((p: any) => p.status === 'pago').length,
    pending: pagamentosSupabase.filter((p: any) => p.status === 'pendente').length,
    overdue: pagamentosSupabase.filter((p: any) => p.status === 'atrasado').length,
    totalReceived: pagamentosSupabase
      .filter((p: any) => p.status === 'pago')
      .reduce((sum: number, p: any) => sum + Number(p.valor || 0), 0),
    totalPending: pagamentosSupabase
      .filter((p: any) => p.status !== 'pago')
      .reduce((sum: number, p: any) => sum + Number(p.valor || 0), 0),
  }

  const notifyManagers = (
    title: string,
    message: string,
    type: 'warning' | 'info' | 'success' | 'error'
  ) => {
    registeredUsers
      .filter((registeredUser) => registeredUser.role === 'gestor')
      .forEach((gestor) => {
        addNotification({
          userId: gestor.id,
          title,
          message,
          type,
          read: false,
        })
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const membro = membrosSupabase.find(
      (m) => String(m.id) === String(formData.athleteId)
    )

    if (!membro) {
      alert('Selecione um atleta válido')
      return
    }

    const { error } = await supabase
      .from('pagamentos')
      .insert([
        {
          id: Date.now(),
          membro_id: Number(membro.id),
          membro_nome: membro.nome,
          valor: Number(formData.amount || 0),
          metodo: 'dinheiro',
          status: 'pendente',
          data_pagamento: formData.dueDate,
        },
      ])

    if (error) {
      console.log('Erro ao adicionar pagamento:', error)
      alert(JSON.stringify(error, null, 2))
      return
    }

    await buscarPagamentos()

    setShowAddModal(false)
    setFormData({
      athleteId: '',
      amount: '150',
      dueDate: '',
      month: '',
      year: new Date().getFullYear().toString(),
    })
  }

  const handleMarkPaid = async (paymentId: any) => {
    const { error } = await supabase
      .from('pagamentos')
      .update({
        status: 'pago',
      })
      .eq('id', paymentId)

    if (error) {
      console.log('Erro ao marcar pagamento como pago:', error)
      alert(JSON.stringify(error, null, 2))
      return
    }

    await buscarPagamentos()
  }

  const handleApproveReceipt = async (recibo: any) => {
    const payment = getPaymentByReceipt(recibo)

    if (!payment?.id) {
      alert(
        'Não encontrei uma mensalidade pendente/atrasada para ligar a este comprovativo. Cria ou seleciona a mensalidade do atleta e tenta novamente.'
      )
      return
    }

    const { error: receiptError } = await supabase
      .from('recibos_pagamentos')
      .update({
        status: 'aprovado',
        pagamento_id: Number(payment.id),
      })
      .eq('id', recibo.id)

    if (receiptError) {
      console.log('Erro ao aprovar comprovativo:', receiptError)
      alert('Erro ao aprovar comprovativo: ' + receiptError.message)
      return
    }

    const { error: paymentError } = await supabase
      .from('pagamentos')
      .update({ status: 'pago' })
      .eq('id', payment.id)

    if (paymentError) {
      console.log('Erro ao atualizar pagamento:', paymentError)
      alert('Comprovativo aprovado, mas erro ao atualizar pagamento: ' + paymentError.message)
      await buscarRecibos()
      return
    }

    await buscarRecibos()
    await buscarPagamentos()
    alert('Comprovativo aprovado e pagamento atualizado.')
  }

  const handleRejectReceipt = async (recibo: any) => {
    const confirmar = confirm('Tens certeza que queres negar este comprovativo?')

    if (!confirmar) return

    const { error } = await supabase
      .from('recibos_pagamentos')
      .update({ status: 'rejeitado' })
      .eq('id', recibo.id)

    if (error) {
      console.log('Erro ao negar comprovativo:', error)
      alert('Erro ao negar comprovativo: ' + error.message)
      return
    }

    await buscarRecibos()
    alert('Comprovativo negado. O pagamento continua pendente.')
  }

  const handleDeletePayment = async (paymentId: any) => {
    const confirmar = confirm('Tens certeza que queres apagar este pagamento?')

    if (!confirmar) return

    const { error } = await supabase
      .from('pagamentos')
      .delete()
      .eq('id', paymentId)

    if (error) {
      console.log('Erro ao apagar pagamento:', error)
      alert(JSON.stringify(error, null, 2))
      return
    }

    await buscarPagamentos()
  }

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault()

   if (isAtleta && !membroLogado) {
  const confirmar = confirm(
    'Não foi encontrado um membro com este email no Supabase. Desejas enviar o comprovativo mesmo assim?'
  )

  if (!confirmar) return
}

    if (!receiptFile) {
      alert('Escolha uma foto ou PDF do comprovativo.')
      return
    }

    const referenciaId = selectedPayment?.id || membroLogado?.id || user?.id || Date.now()
    const fileExt = receiptFile.name.split('.').pop()
    const fileName = `${Date.now()}-${referenciaId}.${fileExt}`
    const filePath = `pagamento-${referenciaId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('recibos-pagamentos')
      .upload(filePath, receiptFile)

    if (uploadError) {
      console.log('Erro ao enviar comprovativo:', uploadError)
      alert('Erro ao enviar comprovativo: ' + uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('recibos-pagamentos')
      .getPublicUrl(filePath)

    const { error: dbError } = await supabase
  .from('recibos_pagamentos')
  .insert([
    {
      id: Date.now(),
      membro_id: selectedPayment?.membro_id
        ? Number(selectedPayment.membro_id)
        : membroLogado?.id
          ? Number(membroLogado.id)
          : null,
      pagamento_id: selectedPayment?.id ? Number(selectedPayment.id) : null,
      ficheiro_url: publicUrlData.publicUrl,
      nome_ficheiro: receiptFile.name,
      status: 'pendente',
    },
  ])

    if (dbError) {
      console.log('Erro ao guardar recibo:', dbError)
      alert('Erro ao guardar recibo: ' + dbError.message)
      return
    }

    alert('Comprovativo enviado com sucesso. Aguarde validação do gestor.')

    notifyManagers(
      'Comprovativo pendente',
      `${selectedPayment?.membro_nome || membroLogado?.nome || user?.name} enviou um comprovativo de pagamento para aprovação.`,
      'warning'
    )

    await buscarRecibos()
    setShowReceiptModal(false)
    setSelectedPayment(null)
    setReceiptFile(null)
  }

  const months = [
    'Janeiro',
    'Fevereiro',
    'Marco',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAtleta ? t('myPaymentsTitle') : t('paymentsTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAtleta
              ? 'Veja os seus pagamentos e envie comprovativos bancários'
              : 'Gerencie as mensalidades dos atletas'}
          </p>
        </div>

        {isGestor && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {t('newMonthlyPayment')}
          </button>
        )}
      </div>

      {/* Stats Cards - Gestor */}
      {isGestor && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('totalReceived')}</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(stats.totalReceived)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('receivable')}</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(stats.totalPending)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('paid')}</p>
                <p className="text-xl font-bold text-foreground">{stats.paid}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('overdue')}</p>
                <p className="text-xl font-bold text-foreground">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Área do atleta */}
      {isAtleta && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Situação dos meus pagamentos
            </h2>

            {pagamentosPendentesOuAtrasados.length > 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-400 font-medium">
                  Tens {pagamentosPendentesOuAtrasados.length} pagamento(s) pendente(s) ou em atraso.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Faz o upload do comprovativo bancário para o gestor validar.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 font-medium">
                  Não tens pagamentos pendentes no momento.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border border-border rounded-lg bg-background/40">
            <h3 className="font-medium text-foreground mb-1">
              Enviar comprovativo de pagamento
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Importa uma foto ou PDF do recibo bancário para o gestor confirmar.
            </p>

            {pagamentosPendentesOuAtrasados.length === 0 && (
              <button
                onClick={() => {
                  setSelectedPayment(null)
                  setShowReceiptModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-4 w-4" />
                {t('sendProof')}
              </button>
            )}
          </div>

          {pagamentosPendentesOuAtrasados.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">
                Escolher mensalidade para enviar comprovativo
              </h3>

              {pagamentosPendentesOuAtrasados.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-border rounded-lg bg-background/40"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency(payment.valor)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Referência: {payment.data_pagamento ? formatDate(payment.data_pagamento) : 'Sem data'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPayment(payment)
                      setShowReceiptModal(true)
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Enviar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aprovação de comprovativos - Gestor */}
      {isGestor && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t('proofApprovals')}
              </h2>
              <p className="text-sm text-muted-foreground">
                Aprove para marcar o pagamento como pago ou negue para manter pendente.
              </p>
            </div>

            {recibosParaAprovacao.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                {recibosParaAprovacao.length} {t('pending')}
              </span>
            )}
          </div>

          {recibosParaAprovacao.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('noPendingProof')}
            </p>
          ) : (
            <div className="space-y-3">
              {recibosParaAprovacao.map((recibo: any) => {
                const payment = getPaymentByReceipt(recibo)
                const member = getMemberByReceipt(recibo)

                return (
                  <div
                    key={recibo.id}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {payment?.membro_nome || member?.nome || t('unidentifiedAthlete')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment?.valor ? formatCurrency(payment.valor) : 'Valor não encontrado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('file')}: {recibo.nome_ficheiro || t('proof')}
                      </p>
                      {recibo.status === 'aprovado' && payment?.status !== 'pago' && (
                        <p className="text-xs text-amber-400 mt-1">
                          Aprovado, mas o pagamento ainda não foi atualizado.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {recibo.ficheiro_url && (
                        <a
                          href={recibo.ficheiro_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 border border-border rounded-lg text-center text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          Ver comprovativo
                        </a>
                      )}

                      <button
                        onClick={() => handleApproveReceipt(recibo)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                      >
                        {t('approve')}
                      </button>

                      <button
                        onClick={() => handleRejectReceipt(recibo)}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:opacity-90 transition-opacity"
                      >
                        {t('deny')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters - Gestor */}
      {isGestor && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchAthlete')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="todos">{t('allStatus')}</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>
      )}

      {/* Payments Table - Gestor */}
      {isGestor && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('athlete')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('reference')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('value')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('due')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('actions')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredPayments.map((payment: any) => {
                  const paymentStatus = payment.status || 'pendente'
                  const StatusIcon =
                    statusIcons[paymentStatus as keyof typeof statusIcons] || Clock

                  return (
                    <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-foreground">{payment.membro_nome}</p>
                      </td>

                      <td className="p-4">
                        <p className="text-foreground">
                          {payment.data_pagamento
                            ? formatDate(payment.data_pagamento)
                            : 'Sem referência'}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-medium text-foreground">
                          {formatCurrency(payment.valor)}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="text-foreground">
                          {payment.data_pagamento
                            ? formatDate(payment.data_pagamento)
                            : 'Sem data'}
                        </p>
                      </td>

                      <td className="p-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                            statusColors[paymentStatus as keyof typeof statusColors] ||
                              'bg-gray-500/20 text-gray-400'
                          )}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusLabels[paymentStatus as keyof typeof statusLabels] || paymentStatus}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          {payment.status !== 'pago' && (
                            <button
                              onClick={() => handleMarkPaid(payment.id)}
                              className="text-sm text-primary hover:underline"
                            >
                              Marcar como Pago
                            </button>
                          )}

                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-sm text-red-500 hover:underline"
                          >
                            Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noPaymentFound')}</p>
            </div>
          )}
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setShowReceiptModal(false)
              setSelectedPayment(null)
              setReceiptFile(null)
            }}
          />

          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {t('sendProof')}
              </h2>
              <button
                onClick={() => {
                  setShowReceiptModal(false)
                  setSelectedPayment(null)
                  setReceiptFile(null)
                }}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadReceipt} className="p-6 space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-sm text-muted-foreground">{t('athlete')}</p>
                <p className="font-medium text-foreground">
                  {selectedPayment?.membro_nome || membroLogado?.nome || user?.name}
                </p>

                <p className="text-sm text-muted-foreground mt-2">Referência</p>
                <p className="font-medium text-foreground">
                  {selectedPayment?.valor
                    ? formatCurrency(selectedPayment.valor)
                    : t('generalProof')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Foto ou PDF do recibo
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false)
                    setSelectedPayment(null)
                    setReceiptFile(null)
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />

          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {t('newMonthlyPayment')}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('athlete')}
                </label>
                <select
                  value={formData.athleteId}
                  onChange={(e) =>
                    setFormData({ ...formData, athleteId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Selecione um atleta</option>
                  {membrosSupabase
                    .filter((membro: any) => membro.status === 'ativo')
                    .map((membro: any) => (
                      <option key={membro.id} value={membro.id}>
                        {membro.nome}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Mes
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) =>
                      setFormData({ ...formData, month: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    required
                    min="2020"
                    max="2030"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Valor (Db)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Criar Mensalidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
