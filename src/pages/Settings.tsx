import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  Key,
  Globe,
  Bot,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  Info,
  Server,
} from 'lucide-react'

const LLM_SERVICES = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'custom', label: 'Custom Endpoint' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api')
  const [newConfig, setNewConfig] = useState({
    name: '',
    service: 'gemini' as const,
    apiKey: '',
    baseUrl: '',
    model: 'gemini-2.0-flash-lite',
  })
  const [showAddForm, setShowAddForm] = useState(false)

  const utils = trpc.useUtils()
  const { data: configs } = trpc.apiConfig.list.useQuery()
  const createConfig = trpc.apiConfig.create.useMutation({
    onSuccess: () => {
      utils.apiConfig.list.invalidate()
      setShowAddForm(false)
      setNewConfig({ name: '', service: 'gemini', apiKey: '', baseUrl: '', model: 'gemini-2.0-flash-lite' })
    },
  })
  const deleteConfig = trpc.apiConfig.delete.useMutation({
    onSuccess: () => utils.apiConfig.list.invalidate(),
  })

  const serviceIcons: Record<string, any> = {
    gemini: Bot,
    openai: Globe,
    custom: Server,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage API keys, LLM configurations, and system settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="api" className="text-xs">
            <Key className="h-3.5 w-3.5 mr-1.5" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="llm" className="text-xs">
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            LLM Service
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            System
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-6">
          {/* Existing Configs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">API Configurations</h3>
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Key
              </Button>
            </div>

            {configs && configs.length > 0 ? (
              configs.map((config: any) => {
                const Icon = serviceIcons[config.service] || Globe
                return (
                  <Card key={config.id} className="group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{config.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {config.service}
                              </Badge>
                              {config.isDefault && (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                  <Check className="h-2.5 w-2.5 mr-0.5" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {config.model || 'default model'}
                              {config.baseUrl && ` · ${config.baseUrl}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Active</span>
                            <Switch checked={config.isActive} />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteConfig.mutate({ id: config.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Key className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No API keys configured</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Add Config Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add API Configuration</CardTitle>
                <CardDescription className="text-xs">
                  Configure a new LLM API endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={newConfig.name}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Production Gemini"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service *</Label>
                    <Select
                      value={newConfig.service}
                      onValueChange={(value) => setNewConfig(prev => ({ ...prev, service: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LLM_SERVICES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={newConfig.apiKey}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API key..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Base URL (optional)</Label>
                    <Input
                      value={newConfig.baseUrl}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={newConfig.model}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="gemini-2.0-flash-lite"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!newConfig.name.trim() || createConfig.isPending}
                    onClick={() => createConfig.mutate(newConfig)}
                  >
                    {createConfig.isPending ? 'Adding...' : 'Add Configuration'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* LLM Service Tab */}
        <TabsContent value="llm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4" />
                LLM Microservice
              </CardTitle>
              <CardDescription className="text-xs">
                FastAPI service running on port 8000 for LLM processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Service URL</p>
                  <p className="text-sm font-mono mt-1">http://localhost:8000</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">API Docs</p>
                  <a
                    href="http://localhost:8000/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-1 inline-block"
                  >
                    Open Swagger UI
                  </a>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Available Endpoints</h4>
                <div className="space-y-2">
                  {[
                    { method: 'POST', path: '/classify', desc: 'Classify text into categories' },
                    { method: 'POST', path: '/extract', desc: 'Extract structured data from text' },
                    { method: 'POST', path: '/route', desc: 'Route requests to destinations' },
                    { method: 'POST', path: '/process', desc: 'Generic LLM processing' },
                    { method: 'GET', path: '/health', desc: 'Health check' },
                    { method: 'GET', path: '/models', desc: 'List available models' },
                  ].map((ep) => (
                    <div key={ep.path} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <Badge variant={ep.method === 'GET' ? 'secondary' : 'default'} className="text-[10px] w-12 justify-center">
                        {ep.method}
                      </Badge>
                      <code className="text-xs font-mono">{ep.path}</code>
                      <span className="text-xs text-muted-foreground ml-auto">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Prompt Engineering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">JSON-Only Output</p>
                  <p className="text-xs text-emerald-700">
                    All prompts include strict JSON formatting instructions to eliminate hallucinations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50">
                <Bot className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">System Instructions</p>
                  <p className="text-xs text-blue-700">
                    Default system prompt enforces JSON-only responses with no markdown or explanations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Input Validation</p>
                  <p className="text-xs text-amber-700">
                    All inputs are validated with Pydantic schemas before processing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Docker Services</CardTitle>
              <CardDescription className="text-xs">
                All services are containerized with Docker Compose
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Main App', port: 3000, desc: 'React frontend + tRPC API' },
                { name: 'LLM Service', port: 8000, desc: 'FastAPI microservice for Gemini' },
                { name: 'n8n', port: 5678, desc: 'Workflow automation platform' },
                { name: 'MySQL', port: 3306, desc: 'Database' },
              ].map((service) => (
                <div key={service.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.desc}</p>
                  </div>
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    port {service.port}
                  </code>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">n8n Workflows</CardTitle>
              <CardDescription className="text-xs">
                Pre-configured workflow templates in n8n-workflows/
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Auto Classification Pipeline', file: 'classification-pipeline.json' },
                { name: 'Data Extraction Pipeline', file: 'data-extraction-pipeline.json' },
                { name: 'Smart Routing Pipeline', file: 'routing-pipeline.json' },
              ].map((wf) => (
                <div key={wf.file} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">{wf.name}</p>
                  </div>
                  <code className="text-xs font-mono text-muted-foreground">{wf.file}</code>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
