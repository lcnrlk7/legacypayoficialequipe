"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tag,
  Target,
  Briefcase,
  FolderOpen,
  Plus,
  Trash2,
  Loader2,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { notificationSound, NOTIFICATION_SOUNDS, type SoundType } from "@/lib/notification-sound";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

interface CostCenter {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  period: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const COLORS = [
  "#FF6B00", "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#84CC16", "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#D946EF", "#EC4899", "#F43F5E",
];

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "tags" | "costCenters" | "goals" | "notifications">("categories");
  const [loading, setLoading] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);

  // Tags
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(COLORS[5]);

  // Cost Centers
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [newCostCenterName, setNewCostCenterName] = useState("");
  const [newCostCenterDesc, setNewCostCenterDesc] = useState("");
  const [newCostCenterColor, setNewCostCenterColor] = useState(COLORS[7]);

  // Goals
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<string | null>(null);
  const [newGoalPeriod, setNewGoalPeriod] = useState("monthly");

  // Notification settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState<SoundType>("coin");
  const [soundVolume, setSoundVolume] = useState(0.5);

  useEffect(() => {
    loadData();
    loadSoundSettings();
  }, []);

  const loadSoundSettings = () => {
    const settings = notificationSound.getSettings();
    setSoundEnabled(settings.enabled);
    setSoundType(settings.soundType);
    setSoundVolume(settings.volume);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, tagRes, ccRes, goalRes] = await Promise.all([
        fetch("/api/user/categories"),
        fetch("/api/user/tags"),
        fetch("/api/user/cost-centers"),
        fetch("/api/user/goals"),
      ]);

      const [catData, tagData, ccData, goalData] = await Promise.all([
        catRes.json(),
        tagRes.json(),
        ccRes.json(),
        goalRes.json(),
      ]);

      setCategories(catData.categories || []);
      setTags(tagData.tags || []);
      setCostCenters(ccData.costCenters || []);
      setGoals(goalData.goals || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Category functions
  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/user/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories([...categories, data.category]);
        setNewCategoryName("");
      }
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await fetch(`/api/user/categories?id=${id}`, { method: "DELETE" });
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
    }
  };

  // Tag functions
  const addTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/user/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });
      if (res.ok) {
        const data = await res.json();
        setTags([...tags, data.tag]);
        setNewTagName("");
      }
    } catch (error) {
      console.error("Erro ao criar tag:", error);
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await fetch(`/api/user/tags?id=${id}`, { method: "DELETE" });
      setTags(tags.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Erro ao deletar tag:", error);
    }
  };

  // Cost Center functions
  const addCostCenter = async () => {
    if (!newCostCenterName.trim()) return;
    try {
      const res = await fetch("/api/user/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCostCenterName, description: newCostCenterDesc, color: newCostCenterColor }),
      });
      if (res.ok) {
        const data = await res.json();
        setCostCenters([...costCenters, data.costCenter]);
        setNewCostCenterName("");
        setNewCostCenterDesc("");
      }
    } catch (error) {
      console.error("Erro ao criar centro de custo:", error);
    }
  };

  const deleteCostCenter = async (id: string) => {
    try {
      await fetch(`/api/user/cost-centers?id=${id}`, { method: "DELETE" });
      setCostCenters(costCenters.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Erro ao deletar centro de custo:", error);
    }
  };

  // Goal functions
  const addGoal = async () => {
    if (!newGoalName.trim() || !newGoalTarget) return;
    try {
      const res = await fetch("/api/user/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGoalName,
          target_amount: parseFloat(newGoalTarget),
          category_id: newGoalCategory,
          period: newGoalPeriod,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoals([...goals, data.goal]);
        setNewGoalName("");
        setNewGoalTarget("");
        setNewGoalCategory(null);
      }
    } catch (error) {
      console.error("Erro ao criar meta:", error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await fetch(`/api/user/goals?id=${id}`, { method: "DELETE" });
      setGoals(goals.filter((g) => g.id !== id));
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
    }
  };

  // Sound functions
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    notificationSound.setEnabled(newValue);
  };

  const changeSoundType = (type: SoundType) => {
    setSoundType(type);
    notificationSound.setSoundType(type);
    notificationSound.play(type);
  };

  const changeVolume = (volume: number) => {
    setSoundVolume(volume);
    notificationSound.setVolume(volume);
  };

  const testSound = () => {
    notificationSound.play();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const tabs = [
    { id: "categories", label: "Categorias", icon: FolderOpen },
    { id: "tags", label: "Tags", icon: Tag },
    { id: "costCenters", label: "Centros de Custo", icon: Briefcase },
    { id: "goals", label: "Metas", icon: Target },
    { id: "notifications", label: "Notificacoes", icon: Volume2 },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 p-6">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-purple-500/20 ring-1 ring-purple-500/30">
              <FolderOpen className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Gestao</h1>
          </div>
          <p className="text-muted-foreground max-w-lg">
            Organize suas transacoes com categorias e tags, defina metas de faturamento e gerencie seus centros de custo para ter controle total do seu negocio.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className="gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Categorias de Transacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-1">
                {COLORS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newCategoryColor === color ? "ring-2 ring-white scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button onClick={addCategory}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma categoria criada
                </p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCategory(cat.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags Tab */}
      {activeTab === "tags" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-1">
                {COLORS.slice(6, 12).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newTagColor === color ? "ring-2 ring-white scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 w-full">
                  Nenhuma tag criada
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    <span>{tag.name}</span>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Centers Tab */}
      {activeTab === "costCenters" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Centros de Custo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do centro de custo"
                  value={newCostCenterName}
                  onChange={(e) => setNewCostCenterName(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {COLORS.slice(7, 11).map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCostCenterColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newCostCenterColor === color ? "ring-2 ring-white scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Descricao (opcional)"
                  value={newCostCenterDesc}
                  onChange={(e) => setNewCostCenterDesc(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addCostCenter}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {costCenters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum centro de custo criado
                </p>
              ) : (
                costCenters.map((cc) => (
                  <div
                    key={cc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cc.color }}
                      />
                      <div>
                        <span className="font-medium">{cc.name}</span>
                        {cc.description && (
                          <p className="text-xs text-muted-foreground">{cc.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCostCenter(cc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals Tab */}
      {activeTab === "goals" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Metas de Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Nome da meta"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Valor alvo (R$)"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
              />
              <select
                value={newGoalCategory || ""}
                onChange={(e) => setNewGoalCategory(e.target.value || null)}
                className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground"
              >
                <option value="">Todas categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={newGoalPeriod}
                onChange={(e) => setNewGoalPeriod(e.target.value)}
                className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground"
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <Button onClick={addGoal} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Criar Meta
            </Button>

            <div className="space-y-3">
              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma meta criada
                </p>
              ) : (
                goals.map((goal) => {
                  const progress = Math.min(100, (Number(goal.current_amount) / goal.target_amount) * 100);
                  return (
                    <div
                      key={goal.id}
                      className="p-4 rounded-lg bg-secondary/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{goal.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {goal.period === "weekly" ? "Semanal" : goal.period === "monthly" ? "Mensal" : "Anual"}
                            {goal.category_name && ` - ${goal.category_name}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGoal(goal.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatCurrency(Number(goal.current_amount))}</span>
                        <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: progress >= 100 ? "#22C55E" : "#FF6B00",
                          }}
                        />
                      </div>
                      <p className="text-xs text-right text-muted-foreground">
                        {progress.toFixed(1)}% concluido
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Som de Notificacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Som ao receber pagamento</p>
                <p className="text-sm text-muted-foreground">
                  Tocar som quando um pagamento for confirmado
                </p>
              </div>
              <Button
                variant={soundEnabled ? "default" : "outline"}
                onClick={toggleSound}
                className="gap-2"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Ativado
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    Desativado
                  </>
                )}
              </Button>
            </div>

            {soundEnabled && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tipo de som</p>
                  <div className="flex gap-2">
                    {(Object.keys(NOTIFICATION_SOUNDS) as SoundType[]).map((type) => (
                      <Button
                        key={type}
                        variant={soundType === type ? "default" : "outline"}
                        onClick={() => changeSoundType(type)}
                        className="capitalize"
                      >
                        {type === "coin" ? "Moeda" : type === "success" ? "Sucesso" : "Dinheiro"}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Volume: {Math.round(soundVolume * 100)}%</p>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <Button variant="outline" onClick={testSound}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Testar Som
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
