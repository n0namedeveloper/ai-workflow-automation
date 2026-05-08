import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Search,
  RefreshCw,
  Timer,
  Hash,
  BarChart3,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

const statusConfig: Record<string, { color: string; icon: any; bg: string }> = {
  completed: { color: 'text-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-50' },
  failed: { color: 'text-red-600', icon: XCircle, bg: 'bg-red-50' },
  running: { color: 'text-blue-600', icon: Zap, bg: 'bg-blue-50' },
  pending: { color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50' },
  cancelled: { color: 'text-gray-600', icon: Activity, bg: 'bg-gray-50' },
}

const responseTimeData = [
  { time: '00:00', ms: 120 },
  { time: '04:00', ms: 95 },
  { time: '08:00', ms: 180 },
  { time: '12:00', ms: 210 },
  { time: '16:00', ms: 165 },
  { time: '20:00', ms: 140 },
]

const throughputData = [
  { hour: '00', count: 12 },
  { hour: '04', count: 8 },
  { hour: '08', count: 45 },
  { hour: '12', count: 67 },
  { hour: '16', count: 52 },
  { hour: '20', count: 34 },
]

export default function PipelineRuns() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const utils = trpc.useUtils()
  const { data: runs, isLoading } = trpc.workflow.listRuns.useQuery(
    { limit: 100 }
  )
  const { data: workflows } = trpc.workflow.list.useQuery()

  const workflowMap = new Map(workflows?.map((w: any) => [w.id, w.name]) || [])

  const filteredRuns = runs?.filter((run: any) => {
    if (statusFilter !== 'all' && run.status !== statusFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const workflowName = workflowMap.get(run.workflowId)?.toLowerCase() || ''
      return (
        workflowName.includes(query) ||
        run.classificationResult?.toLowerCase().includes(query) ||
        String(run.id).includes(query)
      )
    }
    return true
  })

  const statusCounts = runs?.reduce((acc: Record<string, number>, run: any) => {
    acc[run.status] = (acc[run.status] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pipeline Runs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and analyze pipeline execution logs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => utils.workflow.listRuns.invalidate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Runs</p>
                <p className="text-xl font-bold">{runs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{statusCounts.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-xl font-bold">{statusCounts.failed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50">
                <Timer className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Time</p>
                <p className="text-xl font-bold">
                  {runs && runs.length > 0
                    ? `${Math.round(runs.reduce((acc: number, r: any) => acc + (r.processingTimeMs || 0), 0) / runs.length)}ms`
                    : '0ms'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Response Time Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="ms"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Processing Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit=":00" />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search runs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Runs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">
                  <Hash className="h-3.5 w-3.5" />
                </TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Processing Time</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredRuns && filteredRuns.length > 0 ? (
                filteredRuns.map((run: any) => {
                  const config = statusConfig[run.status] || statusConfig.pending
                  const StatusIcon = config.icon
                  return (
                    <TableRow key={run.id} className="group">
                      <TableCell className="font-mono text-xs">#{run.id}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {workflowMap.get(run.workflowId) || `Workflow #${run.workflowId}`}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.bg} ${config.color} border-0 text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {run.classificationResult || '-'}
                      </TableCell>
                      <TableCell>
                        {run.processingTimeMs ? (
                          <span className={`text-sm font-mono ${
                            run.processingTimeMs < 200 ? 'text-emerald-600' :
                            run.processingTimeMs < 500 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {run.processingTimeMs}ms
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {run.tokensUsed || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(run.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No runs found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
