import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Workflow,
  Clock,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Timer,
} from 'lucide-react'
import {
  AreaChart,
  Area,
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
} from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1']

const mockChartData = [
  { name: 'Mon', runs: 45, avg: 120 },
  { name: 'Tue', runs: 62, avg: 145 },
  { name: 'Wed', runs: 78, avg: 130 },
  { name: 'Thu', runs: 54, avg: 155 },
  { name: 'Fri', runs: 89, avg: 110 },
  { name: 'Sat', runs: 34, avg: 140 },
  { name: 'Sun', runs: 41, avg: 125 },
]

const statusData = [
  { name: 'Completed', value: 342, color: '#10b981' },
  { name: 'Failed', value: 28, color: '#ef4444' },
  { name: 'Pending', value: 15, color: '#f59e0b' },
  { name: 'Running', value: 8, color: '#6366f1' },
]

export default function Home() {
  const { data: stats } = trpc.workflow.stats.useQuery()
  const { data: activity } = trpc.workflow.recentActivity.useQuery()
  const { data: workflows } = trpc.workflow.list.useQuery()

  const statCards = [
    {
      title: 'Active Workflows',
      value: stats?.workflows || 0,
      icon: Workflow,
      description: 'Configured pipelines',
      trend: '+12%',
      trendUp: true,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Runs',
      value: stats?.totalRuns || 0,
      icon: Activity,
      description: 'All time executions',
      trend: '+23%',
      trendUp: true,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: CheckCircle2,
      description: 'Completed successfully',
      trend: '+5%',
      trendUp: true,
      color: 'text-violet-500',
      bgColor: 'bg-violet-50',
    },
    {
      title: 'Avg Response',
      value: `${stats?.avgResponseTime || 0}ms`,
      icon: Timer,
      description: 'Average processing time',
      trend: '-18%',
      trendUp: false,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
      default: return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
      inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
      draft: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    }
    return variants[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs flex items-center gap-0.5 ${stat.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.trend}
                </span>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Processing Activity</CardTitle>
                <CardDescription>Daily pipeline executions and response times</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="runs"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRuns)"
                  name="Runs"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run Status Distribution</CardTitle>
            <CardDescription>Current pipeline status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-semibold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest pipeline executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity && activity.length > 0 ? activity.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.workflowName || `Workflow #${item.id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.classificationResult || item.status} · {item.processingTimeMs ? `${item.processingTimeMs}ms` : 'N/A'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs">Run your first workflow to see activity here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Workflows */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Active Workflows</CardTitle>
                <CardDescription>Currently configured pipelines</CardDescription>
              </div>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflows && workflows.length > 0 ? workflows.map((wf: any) => (
                <div key={wf.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{wf.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 ${getStatusBadge(wf.status)}`}>
                        {wf.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{wf.type} · {wf.geminiModel || 'default'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{wf.processedCount || 0}</p>
                    <p className="text-[10px] text-muted-foreground">runs</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No workflows configured</p>
                  <p className="text-xs">Create your first workflow to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
