import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Play,
  Trash2,
  Workflow,
  Bot,
  FileJson,
  GitBranch,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react'

const WORKFLOW_TEMPLATES = [
  {
    id: 'classification',
    name: 'Auto Classification',
    description: 'Automatically classify incoming requests into categories using LLM',
    type: 'classification',
    icon: GitBranch,
    promptTemplate: `Classify the following text into exactly one category.

CATEGORIES: urgent, normal, low-priority

INPUT TEXT:
{{input}}

Respond with JSON:
{
  "category": "chosen_category",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`,
  },
  {
    id: 'extraction',
    name: 'Data Extraction',
    description: 'Extract structured fields from unstructured text',
    type: 'extraction',
    icon: FileJson,
    promptTemplate: `Extract the following fields from the text:
FIELDS: name, email, phone, company

INPUT TEXT:
{{input}}

Respond with JSON:
{
  "extracted": {
    "field_name": "value_or_null"
  },
  "confidence": 0.95,
  "fields_found": 0,
  "fields_total": 4
}`,
  },
  {
    id: 'routing',
    name: 'Smart Routing',
    description: 'Route requests to appropriate departments or services',
    type: 'routing',
    icon: Workflow,
    promptTemplate: `Determine the best route for this request.

ROUTES:
- support: Customer support inquiries
- sales: Sales and pricing questions
- technical: Technical issues and bugs

INPUT REQUEST:
{{input}}

Respond with JSON:
{
  "route": "chosen_route",
  "confidence": 0.95,
  "reasoning": "brief explanation",
  "priority": "normal"
}`,
  },
]

const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Fast)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Balanced)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Best Quality)' },
]

export default function Workflows() {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'classification' as const,
    geminiModel: 'gemini-2.0-flash-lite',
    promptTemplate: '',
    inputSchema: '',
    outputSchema: '',
    webhookUrl: '',
  })

  const utils = trpc.useUtils()
  const { data: workflows, isLoading } = trpc.workflow.list.useQuery()
  const createWorkflow = trpc.workflow.create.useMutation({
    onSuccess: () => {
      utils.workflow.list.invalidate()
      setCreateOpen(false)
      resetForm()
    },
  })
  const deleteWorkflow = trpc.workflow.delete.useMutation({
    onSuccess: () => utils.workflow.list.invalidate(),
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'classification',
      geminiModel: 'gemini-2.0-flash-lite',
      promptTemplate: '',
      inputSchema: '',
      outputSchema: '',
      webhookUrl: '',
    })
    setSelectedTemplate(null)
  }

  const selectTemplate = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setFormData(prev => ({
        ...prev,
        type: template.type as any,
        promptTemplate: template.promptTemplate,
        name: prev.name || template.name,
        description: prev.description || template.description,
      }))
    }
  }

  const handleCreate = () => {
    if (!formData.name.trim()) return
    createWorkflow.mutate({
      name: formData.name,
      description: formData.description,
      type: formData.type as any,
      geminiModel: formData.geminiModel,
      promptTemplate: formData.promptTemplate,
      inputSchema: formData.inputSchema,
      outputSchema: formData.outputSchema,
      webhookUrl: formData.webhookUrl,
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
      inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
      draft: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    }
    return variants[status] || 'bg-gray-100 text-gray-700'
  }

  const copyWebhookUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflows</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your n8n pipeline configurations and LLM prompt templates
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
              <DialogDescription>
                Configure a new pipeline with LLM-powered processing
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Start from Template</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {WORKFLOW_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => selectTemplate(template.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedTemplate === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <template.icon className={`h-5 w-5 mb-2 ${
                          selectedTemplate === template.id ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <p className="text-xs font-medium">{template.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Workflow Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Customer Request Classifier"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What does this workflow do?"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Type & Model */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classification">Classification</SelectItem>
                        <SelectItem value="extraction">Extraction</SelectItem>
                        <SelectItem value="routing">Routing</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gemini Model</Label>
                    <Select
                      value={formData.geminiModel}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, geminiModel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GEMINI_MODELS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Prompt Template */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt Template</Label>
                  <Textarea
                    id="prompt"
                    value={formData.promptTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, promptTemplate: e.target.value }))}
                    placeholder="Enter your LLM prompt template..."
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{{input}}'} as placeholder for incoming data
                  </p>
                </div>

                {/* Advanced */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="inputSchema">Input Schema (JSON)</Label>
                    <Textarea
                      id="inputSchema"
                      value={formData.inputSchema}
                      onChange={(e) => setFormData(prev => ({ ...prev, inputSchema: e.target.value }))}
                      placeholder='{"text": "string", "categories": ["string"]}'
                      rows={2}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="outputSchema">Output Schema (JSON)</Label>
                    <Textarea
                      id="outputSchema"
                      value={formData.outputSchema}
                      onChange={(e) => setFormData(prev => ({ ...prev, outputSchema: e.target.value }))}
                      placeholder='{"category": "string", "confidence": "number"}'
                      rows={2}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook">Webhook URL</Label>
                    <Input
                      id="webhook"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://your-app.com/api/webhook"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name.trim() || createWorkflow.isPending}
              >
                {createWorkflow.isPending ? 'Creating...' : 'Create Workflow'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Section */}
      <div>
        <h3 className="text-sm font-medium mb-3">Quick Templates</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {WORKFLOW_TEMPLATES.map((template) => (
            <Card key={template.id} className="group hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => {
                setCreateOpen(true)
                selectTemplate(template.id)
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors`}>
                    <template.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">{template.type}</Badge>
                </div>
                <CardTitle className="text-sm mt-2">{template.name}</CardTitle>
                <CardDescription className="text-xs">{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Workflows List */}
      <div>
        <h3 className="text-sm font-medium mb-3">Your Workflows</h3>
        {isLoading ? (
          <div className="text-center py-12">
            <Workflow className="h-8 w-8 mx-auto animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading workflows...</p>
          </div>
        ) : workflows && workflows.length > 0 ? (
          <div className="space-y-3">
            {workflows.map((wf: any) => (
              <Card key={wf.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{wf.name}</h4>
                          <Badge className={`text-[10px] px-1.5 py-0 ${getStatusBadge(wf.status)}`}>
                            {wf.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{wf.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {wf.geminiModel || 'default'}
                          </span>
                          <span>{wf.type}</span>
                          <span>{wf.processedCount || 0} runs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {wf.webhookUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyWebhookUrl(wf.webhookUrl, String(wf.id))}
                        >
                          {copiedId === String(wf.id) ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => deleteWorkflow.mutate({ id: wf.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Workflow className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No workflows yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create your first workflow to start automating with LLM
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
