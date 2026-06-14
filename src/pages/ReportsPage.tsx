import { useMemo, useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
import {
  Users,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'

const COLORS = ['#22c55e', '#06b6d4', '#3b82f6', '#eab308', '#ef4444']

const CHART_GRID = '#1f3a25'
const CHART_AXIS = '#9ca3af'
const CHART_TOOLTIP_BG = '#07140b'
const CHART_TOOLTIP_TEXT = '#f5f5f5'
const CHART_GREEN = '#22c55e'
const CHART_BLUE = '#06b6d4'
const BELT_ORDER = [
  'Branca',
  'Amarela',
  'Laranja',
  'Verde',
  'Azul',
  'Castanha',
  'Preta (1º Dan)',
  'Preta (2º Dan)',
]

function normalizeText(value: any) {
  return String(value || '').trim().toLowerCase()
}

function normalizeBeltName(value: any) {
  const belt = String(value || '').trim()
  const normalized = normalizeText(belt)

  const aliases: Record<string, string> = {
    branca: 'Branca',
    amarelo: 'Amarela',
    amarela: 'Amarela',
    laranja: 'Laranja',
    verde: 'Verde',
    azul: 'Azul',
    castanho: 'Castanha',
    castanha: 'Castanha',
    marrom: 'Castanha',
    preta: 'Preta (1º Dan)',
    'preta (1º dan)': 'Preta (1º Dan)',
    'preta (2º dan)': 'Preta (2º Dan)',
    'preta (2ª dan)': 'Preta (2º Dan)',
    '2º dan (preta)': 'Preta (2º Dan)',
    '2ª dan (preta)': 'Preta (2º Dan)',
  }

  return aliases[normalized] || belt || 'Sem faixa'
}

function sortBelts(a: { name: string }, b: { name: string }) {
  const indexA = BELT_ORDER.indexOf(a.name)
  const indexB = BELT_ORDER.indexOf(b.name)

  return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
}

export default function ReportsPage() {
  const { trainings } = useStore()
  const { t } = useTranslation()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [stockItems, setStockItems] = useState<any[]>([])
  const [stockMovements, setStockMovements] = useState<any[]>([])
  const [athletes, setAthletes] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    carregarDadosEstoque()
    carregarMembros()
  }, [])

  const carregarMembros = async () => {
    const { data, error } = await supabase.from('membros').select('*')

    if (error) {
      console.error('Erro ao carregar membros:', error)
      return
    }

    const membrosFormatados = (data || []).map((membro: any) => ({
      id: String(membro.id),
      name: membro.nome,
      email: membro.email,
      phone: membro.telefone,
      status: membro.status,
      modality: membro.modalidade || membro.modality || 'Sem modalidade',
      belt: normalizeBeltName(membro.faixa || membro.plano),
    }))

    setAthletes(membrosFormatados)
  }

  const carregarDadosEstoque = async () => {
    const { data: produtos, error: erroProdutos } = await supabase
      .from('produtos')
      .select('*')

    if (erroProdutos) {
      console.error('Erro ao carregar produtos:', erroProdutos)
      return
    }

    const produtosFormatados = (produtos || []).map((item: any) => ({
      id: String(item.id),
      name: item.nome,
      category: item.categoria,
      quantity: Number(item.quantidade || item.stock || 0),
      minQuantity: Number(item.quantidade_minima || 5),
      price: Number(item.preco || 0),
    }))

    setStockItems(produtosFormatados)

    const { data: movimentos, error: erroMovimentos } = await supabase
      .from('movimentos_estoque')
      .select('*')

    if (erroMovimentos) {
      console.error('Erro ao carregar movimentos:', erroMovimentos)
      return
    }

    const movimentosFormatados = (movimentos || []).map((m: any) => ({
      id: String(m.id),
      itemId: String(m.produto_id),
      type: m.tipo,
      quantity: Number(m.quantidade || 0),
      reason: m.motivo || '',
      date: m.created_at,
    }))

    setStockMovements(movimentosFormatados)
  }

  const athleteStats = useMemo(() => {
    const total = athletes.length
    const active = athletes.filter((a) => a.status === 'ativo').length
    const inactive = total - active
    const byModality: Record<string, number> = {}
    const byBelt: Record<string, number> = {}

    athletes.forEach((a) => {
      byModality[a.modality] = (byModality[a.modality] || 0) + 1
      byBelt[a.belt] = (byBelt[a.belt] || 0) + 1
    })

    return {
      total,
      active,
      inactive,
      byModality: Object.entries(byModality).map(([name, value]) => ({
        name,
        value,
      })),
      byBelt: Object.entries(byBelt)
        .map(([name, value]) => ({
          name,
          value,
        }))
        .sort(sortBelts),
    }
  }, [athletes])

  const trainingStats = useMemo(() => {
    const total = trainings.length
    const byModality: Record<string, number> = {}
    const byDay: Record<string, number> = {}
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

    trainings.forEach((t) => {
      byModality[t.modality] = (byModality[t.modality] || 0) + 1
      const day = days[new Date(t.date).getDay()]
      byDay[day] = (byDay[day] || 0) + 1
    })

    let totalEnrolled = 0
    let totalPresent = 0

    trainings.forEach((t) => {
      totalEnrolled += t.enrolledAthletes.length
      totalPresent += Object.values(t.attendance).filter(Boolean).length
    })

    const attendanceRate =
      totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0

    return {
      total,
      attendanceRate,
      byModality: Object.entries(byModality).map(([name, value]) => ({
        name,
        value,
      })),
      byDay: days.map((day) => ({ day, treinos: byDay[day] || 0 })),
    }
  }, [trainings])

  const stockStats = useMemo(() => {
    const total = stockItems.length
    const lowStock = stockItems.filter((i) => i.quantity <= i.minQuantity).length
    const totalValue = stockItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const byCategory: Record<string, { count: number; value: number }> = {}

    stockItems.forEach((i) => {
      if (!byCategory[i.category]) {
        byCategory[i.category] = { count: 0, value: 0 }
      }

      byCategory[i.category].count += 1
      byCategory[i.category].value += i.price * i.quantity
    })

    const entradas = stockMovements.filter((m) => m.type === 'entrada').length
    const saidas = stockMovements.filter((m) => m.type === 'saida').length

    return {
      total,
      lowStock,
      totalValue,
      entradas,
      saidas,
      byCategory: Object.entries(byCategory).map(([name, data]) => ({
        name: getCategoryLabel(name),
        count: data.count,
        value: data.value,
      })),
    }
  }, [stockItems, stockMovements])

  const monthlyGrowthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']

    return months.map((month, i) => ({
      month,
      atletas: Math.floor(athletes.length * (0.6 + i * 0.08)),
      treinos: Math.floor(trainings.length * (0.5 + i * 0.1)),
    }))
  }, [athletes.length, trainings.length])

  const handleExport = async () => {
    try {
      setExporting(true)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        alert('Não foi possível gerar o relatório.')
        return
      }

      canvas.width = 1200
      canvas.height = 1600

      const drawRoundedRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
        fill: string,
        stroke?: string
      ) => {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()

        ctx.fillStyle = fill
        ctx.fill()

        if (stroke) {
          ctx.strokeStyle = stroke
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }

      const drawText = (
        text: string,
        x: number,
        y: number,
        size = 22,
        color = '#f8fafc',
        weight: 'normal' | 'bold' = 'normal'
      ) => {
        ctx.fillStyle = color
        ctx.font = `${weight} ${size}px Arial`
        ctx.fillText(text, x, y)
      }

      const drawCard = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        value: string,
        subtitle: string
      ) => {
        drawRoundedRect(x, y, w, h, 18, '#07140b', '#1f3a25')
        drawText(title, x + 25, y + 40, 18, '#9ca3af')
        drawText(value, x + 25, y + 85, 28, '#f8fafc', 'bold')
        drawText(subtitle, x + 25, y + 122, 18, '#22c55e')
      }

      const drawBarChart = (
        title: string,
        data: { label: string; value: number }[],
        x: number,
        y: number,
        w: number,
        h: number
      ) => {
        drawRoundedRect(x, y, w, h, 18, '#07140b', '#1f3a25')
        drawText(title, x + 25, y + 40, 22, '#f8fafc', 'bold')

        const maxValue = Math.max(...data.map((d) => d.value), 1)
        const chartX = x + 55
        const chartY = y + 80
        const chartW = w - 100
        const chartH = h - 135
        const barGap = 18
        const barW = Math.max(
          25,
          (chartW - barGap * (data.length - 1)) / Math.max(data.length, 1)
        )

        ctx.strokeStyle = '#1f3a25'
        ctx.lineWidth = 1

        for (let i = 0; i <= 4; i++) {
          const gy = chartY + (chartH / 4) * i
          ctx.beginPath()
          ctx.moveTo(chartX, gy)
          ctx.lineTo(chartX + chartW, gy)
          ctx.stroke()
        }

        data.forEach((item, index) => {
          const barH = (item.value / maxValue) * chartH
          const bx = chartX + index * (barW + barGap)
          const by = chartY + chartH - barH

          ctx.fillStyle = index % 2 === 0 ? '#22c55e' : '#06b6d4'
          ctx.fillRect(bx, by, barW, barH)

          drawText(String(item.value), bx + 4, by - 10, 16, '#f8fafc', 'bold')
          drawText(item.label.slice(0, 10), bx, chartY + chartH + 30, 14, '#9ca3af')
        })
      }

      const drawListBox = (
        title: string,
        items: { label: string; value: string | number; color?: string }[],
        x: number,
        y: number,
        w: number,
        h: number
      ) => {
        drawRoundedRect(x, y, w, h, 18, '#07140b', '#1f3a25')
        drawText(title, x + 25, y + 40, 22, '#f8fafc', 'bold')

        items.forEach((item, index) => {
          const lineY = y + 85 + index * 38
          drawText(item.label, x + 25, lineY, 18, '#9ca3af')
          drawText(String(item.value), x + w - 145, lineY, 18, item.color || '#f8fafc', 'bold')
        })
      }

      ctx.fillStyle = '#020617'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawText('MagManage', 60, 70, 34, '#22c55e', 'bold')
      drawText(t('reportAcademy'), 60, 115, 30, '#f8fafc', 'bold')
      drawText(
        `Gerado em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}`,
        60,
        150,
        18,
        '#9ca3af'
      )

      drawCard(
        60,
        200,
        250,
        150,
        t('totalAthletes'),
        String(athleteStats.total),
        `${athleteStats.active} ativos`
      )

      drawCard(
        335,
        200,
        250,
        150,
        t('trainings'),
        String(trainingStats.total),
        `${trainingStats.attendanceRate}% presença`
      )

      drawCard(
        610,
        200,
        250,
        150,
        t('stockValue'),
        formatCurrency(stockStats.totalValue),
        `${stockStats.total} itens`
      )

      drawCard(
        885,
        200,
        250,
        150,
        t('lowStock'),
        String(stockStats.lowStock),
        'para repor'
      )

      drawBarChart(
        t('athletesByModality'),
        athleteStats.byModality.map((item: any) => ({
          label: item.name,
          value: item.value,
        })),
        60,
        400,
        520,
        330
      )

      drawBarChart(
        'Distribuição de Faixas',
        athleteStats.byBelt.map((item: any) => ({
          label: item.name,
          value: item.value,
        })),
        620,
        400,
        520,
        330
      )

      drawBarChart(
        t('trainingByWeekday'),
        trainingStats.byDay.map((item: any) => ({
          label: item.day,
          value: item.treinos,
        })),
        60,
        780,
        520,
        330
      )

      drawBarChart(
        t('stockCategory'),
        stockStats.byCategory.map((item: any) => ({
          label: item.name,
          value: item.count,
        })),
        620,
        780,
        520,
        330
      )

      drawListBox(
        t('athletesTitle'),
        [
          { label: 'Total', value: athleteStats.total },
          { label: 'Ativos', value: athleteStats.active, color: '#22c55e' },
          { label: 'Inativos', value: athleteStats.inactive, color: '#ef4444' },
          {
            label: 'Taxa Retenção',
            value:
              athleteStats.total > 0
                ? `${Math.round((athleteStats.active / athleteStats.total) * 100)}%`
                : '0%',
          },
        ],
        60,
        1160,
        330,
        260
      )

      drawListBox(
        t('trainingsTitle'),
        [
          { label: 'Total', value: trainingStats.total },
          { label: t('allModalities'), value: trainingStats.byModality.length },
          { label: 'Taxa Presença', value: `${trainingStats.attendanceRate}%`, color: '#22c55e' },
        ],
        435,
        1160,
        330,
        260
      )

      drawListBox(
        t('stockTitle'),
        [
          { label: 'Itens', value: stockStats.total },
          { label: t('lowStock'), value: stockStats.lowStock, color: '#ef4444' },
          { label: 'Valor Total', value: formatCurrency(stockStats.totalValue) },
          { label: 'Movimentações', value: stockStats.entradas + stockStats.saidas },
        ],
        810,
        1160,
        330,
        260
      )

      drawText('MagManage - Sistema de Gestão de Academia', 60, 1520, 18, '#9ca3af')

      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')

      link.href = image
      link.download = `relatorio-magmanage-${new Date().toISOString().split('T')[0]}.png`
      link.click()
    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error)
      alert('Erro ao exportar relatório: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header fora da imagem */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('reportsTitle')}</h1>
          <p className="text-muted-foreground">{t('completeAnalysis')}</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="quarter">Último Trimestre</option>
            <option value="year">Último Ano</option>
          </select>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity neon-glow disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {exporting ? 'A exportar...' : t('exportPng')}
          </button>
        </div>
      </div>

      {/* Visualização normal da página */}
      <div className="space-y-6 bg-background p-4 rounded-xl">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground">Relatório MagManage</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerado em {new Date().toLocaleDateString('pt-PT')} às{' '}
            {new Date().toLocaleTimeString('pt-PT')}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title={t('totalAthletes')}
            value={athleteStats.total}
            change={`${athleteStats.active} ativos`}
            icon={Users}
            trend="up"
          />

          <SummaryCard
            title={t('trainings')}
            value={trainingStats.total}
            change={`${trainingStats.attendanceRate}% presença`}
            icon={Calendar}
            trend="up"
          />

          <SummaryCard
            title={t('stockValue')}
            value={formatCurrency(stockStats.totalValue)}
            change={`${stockStats.total} itens`}
            icon={Package}
            trend="neutral"
          />

          <SummaryCard
            title={t('lowStockItems')}
            value={stockStats.lowStock}
            change="para repor"
            icon={Package}
            trend={stockStats.lowStock > 0 ? 'down' : 'up'}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('monthlyGrowth')}
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="month" stroke={CHART_AXIS} fontSize={12} />
                  <YAxis stroke={CHART_AXIS} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_TOOLTIP_BG,
                      border: `1px solid ${CHART_GRID}`,
                      borderRadius: '8px',
                      color: CHART_TOOLTIP_TEXT,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="atletas"
                    name={t('athletesTitle')}
                    stroke={CHART_GREEN}
                    strokeWidth={2}
                    dot={{ fill: CHART_GREEN }}
                  />
                  <Line
                    type="monotone"
                    dataKey="treinos"
                    name={t('trainingsTitle')}
                    stroke={CHART_BLUE}
                    strokeWidth={2}
                    dot={{ fill: CHART_BLUE }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('athletesByModality')}
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={athleteStats.byModality}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {athleteStats.byModality.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_TOOLTIP_BG,
                      border: `1px solid ${CHART_GRID}`,
                      borderRadius: '8px',
                      color: CHART_TOOLTIP_TEXT,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('trainings')}
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trainingStats.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="day" stroke={CHART_AXIS} fontSize={12} />
                  <YAxis stroke={CHART_AXIS} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_TOOLTIP_BG,
                      border: `1px solid ${CHART_GRID}`,
                      borderRadius: '8px',
                      color: CHART_TOOLTIP_TEXT,
                    }}
                  />
                  <Bar
                    dataKey="treinos"
                    name={t('trainingsTitle')}
                    fill={CHART_GREEN}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('beltDistribution')}
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={athleteStats.byBelt} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis type="number" stroke={CHART_AXIS} fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={CHART_AXIS}
                    fontSize={11}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_TOOLTIP_BG,
                      border: `1px solid ${CHART_GRID}`,
                      borderRadius: '8px',
                      color: CHART_TOOLTIP_TEXT,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name={t('athletesTitle')}
                    fill={CHART_BLUE}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stock Overview */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('stockCategory')}
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockStats.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="name" stroke={CHART_AXIS} fontSize={11} />
                  <YAxis stroke={CHART_AXIS} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_TOOLTIP_BG,
                      border: `1px solid ${CHART_GRID}`,
                      borderRadius: '8px',
                      color: CHART_TOOLTIP_TEXT,
                    }}
                    formatter={(value: number, name: string) =>
                      name === 'value' ? formatCurrency(value) : value
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name={t('quantity')}
                    fill={CHART_GREEN}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('stockMovements')}
            </h3>

            <div className="h-64 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div
                    className="flex items-center justify-center w-20 h-20 mx-auto rounded-full mb-3"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                  >
                    <TrendingUp className="h-10 w-10 text-primary" />
                  </div>

                  <p className="text-3xl font-bold text-primary">{stockStats.entradas}</p>
                  <p className="text-muted-foreground">Entradas</p>
                </div>

                <div>
                  <div
                    className="flex items-center justify-center w-20 h-20 mx-auto rounded-full mb-3"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    <TrendingDown className="h-10 w-10 text-destructive" />
                  </div>

                  <p className="text-3xl font-bold text-destructive">{stockStats.saidas}</p>
                  <p className="text-muted-foreground">Saídas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t('detailedSummary')}</h3>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">{t('athletesTitle')}</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-foreground font-medium">{athleteStats.total}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ativos</span>
                  <span className="text-primary font-medium">{athleteStats.active}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inativos</span>
                  <span className="text-destructive font-medium">{athleteStats.inactive}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa Retenção</span>
                  <span className="text-foreground font-medium">
                    {athleteStats.total > 0
                      ? Math.round((athleteStats.active / athleteStats.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">{t('trainingsTitle')}</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-foreground font-medium">{trainingStats.total}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('allModalities')}</span>
                  <span className="text-foreground font-medium">
                    {trainingStats.byModality.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa Presença</span>
                  <span className="text-primary font-medium">
                    {trainingStats.attendanceRate}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">{t('stockTitle')}</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens</span>
                  <span className="text-foreground font-medium">{stockStats.total}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('lowStock')}</span>
                  <span className="text-destructive font-medium">
                    {stockStats.lowStock}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(stockStats.totalValue)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Movimentações</span>
                  <span className="text-foreground font-medium">
                    {stockStats.entradas + stockStats.saidas}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: string | number
  change: string
  icon: React.ElementType
  trend: 'up' | 'down' | 'neutral'
}

function SummaryCard({ title, value, change, icon: Icon, trend }: SummaryCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>

        {trend === 'up' && <TrendingUp className="h-5 w-5 text-primary" />}
        {trend === 'down' && <TrendingDown className="h-5 w-5 text-destructive" />}
      </div>

      <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{change}</p>
      <p className="text-xs text-muted-foreground mt-2">{title}</p>
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    equipamento: 'Equipamento',
    uniforme: 'Uniforme',
    suplemento: 'Suplemento',
    limpeza: 'Limpeza',
    outro: 'Outro',
  }

  return labels[category] || category
}
