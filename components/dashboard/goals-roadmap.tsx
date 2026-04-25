"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, MapPin, Loader2, Gift, Play, ChevronLeft, ChevronRight, RotateCcw, Award, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Reward {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface GoalsRoadmapProps {
  totalRevenue: number;
  userId: string;
}

// Recompensas da simulacao
const simulationRewards = [
  { 
    id: 1, 
    type: "bracelet", 
    name: "Pulseira Exclusiva", 
    value: 20000, 
    label: "R$ 20K Faturados",
    description: "Uma pulseira exclusiva LegacyPay para celebrar seus primeiros R$ 20K!",
    icon: "bracelet",
    level: "Conquista Bronze"
  },
  { 
    id: 2, 
    type: "plaque_100k", 
    name: "Placa 100K", 
    value: 100000, 
    label: "R$ 100K Faturados",
    description: "Placa comemorativa pelos R$ 100K faturados na plataforma!",
    icon: "plaque",
    level: "Conquista Prata"
  },
  { 
    id: 3, 
    type: "plaque_500k", 
    name: "Placa 500K", 
    value: 500000, 
    label: "R$ 500K Faturados",
    description: "Placa de reconhecimento pelo meio milhao faturado!",
    icon: "plaque",
    level: "Conquista Ouro"
  },
  { 
    id: 4, 
    type: "plaque_1m", 
    name: "Placa 1M", 
    value: 1000000, 
    label: "R$ 1M Faturados",
    description: "Placa premium pelo primeiro milhao faturado na LegacyPay!",
    icon: "plaque",
    level: "Conquista Diamante"
  },
  { 
    id: 5, 
    type: "event", 
    name: "Evento Top Sellers", 
    value: 1000000, 
    label: "Evento Exclusivo",
    description: "Convite para o evento anual dos maiores sellers da plataforma LegacyPay!",
    icon: "event",
    level: "Conquista Lendario"
  },
];

const milestones = [
  { value: 1000, label: "R$ 1K", row: 1, col: 1 },
  { value: 10000, label: "R$ 10K", row: 1, col: 2 },
  { value: 20000, label: "R$ 20K", row: 1, col: 3, hasBadge: true, badgeType: "bracelet" },
  { value: 50000, label: "R$ 50K", row: 1, col: 5 },
  { value: 75000, label: "R$ 75K", row: 2, col: 5 },
  { value: 100000, label: "R$ 100K", row: 2, col: 4, hasBadge: true, badgeType: "plaque_100k" },
  { value: 250000, label: "R$ 250K", row: 2, col: 2 },
  { value: 375000, label: "R$ 375K", row: 2, col: 1 },
  { value: 500000, label: "R$ 500K", row: 3, col: 1, hasBadge: true, badgeType: "plaque_500k" },
  { value: 750000, label: "R$ 750K", row: 3, col: 3 },
  { value: 1000000, label: "R$ 1M", row: 3, col: 4, hasBadge: true, badgeType: "plaque_1m" },
];

const achievementNames: Record<string, string> = {
  bracelet: "Pulseira Exclusiva",
  plaque_100k: "Placa 100K",
  plaque_500k: "Placa 500K",
  plaque_1m: "Placa 1M",
  event: "Evento Top Sellers",
};

const achievementLevels = [
  { name: "Conquista Bronze", minValue: 0, maxValue: 20000, color: "from-orange-700 to-orange-900" },
  { name: "Conquista Prata", minValue: 20000, maxValue: 100000, color: "from-gray-400 to-gray-600" },
  { name: "Conquista Ouro", minValue: 100000, maxValue: 500000, color: "from-yellow-500 to-yellow-700" },
  { name: "Conquista Diamante", minValue: 500000, maxValue: 1000000, color: "from-cyan-400 to-blue-600" },
  { name: "Conquista Lendario", minValue: 1000000, maxValue: Infinity, color: "from-purple-500 to-pink-600" },
];

export function GoalsRoadmap({ totalRevenue, userId }: GoalsRoadmapProps) {
  const [userRewards, setUserRewards] = useState<Reward[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<typeof milestones[0] | null>(null);
  const [address, setAddress] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSimulation, setShowSimulation] = useState(false);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);

  useEffect(() => {
    loadRewards();
  }, [userId]);

  async function loadRewards() {
    try {
      const response = await fetch('/api/user/rewards');
      if (response.ok) {
        const data = await response.json();
        setUserRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
    setIsLoading(false);
  }

  async function claimReward() {
    if (!selectedMilestone || !address || !selectedMilestone.badgeType) return;

    setIsClaiming(true);
    try {
      const response = await fetch('/api/user/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardType: selectedMilestone.badgeType,
          amount: selectedMilestone.value,
          address,
        }),
      });

      if (response.ok) {
        await loadRewards();
        setShowModal(false);
        setSelectedMilestone(null);
        setAddress("");
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao solicitar premiacao');
      }
    } catch (error) {
      console.error("Erro ao solicitar premiacao:", error);
      alert("Erro ao solicitar premiacao. Tente novamente.");
    } finally {
      setIsClaiming(false);
    }
  }

  const getMilestoneStatus = (milestone: typeof milestones[0]) => {
    if (milestone.hasBadge && milestone.badgeType) {
      const reward = userRewards.find(r => r.type === milestone.badgeType);
      if (reward) return reward.status;
    }
    if (totalRevenue >= milestone.value) return "completed";
    return "locked";
  };

  // Encontrar nivel atual e proxima meta
  const currentLevel = achievementLevels.find(
    level => totalRevenue >= level.minValue && totalRevenue < level.maxValue
  ) || achievementLevels[0];

  const nextMilestone = milestones.find(m => totalRevenue < m.value);
  const progressPercent = nextMilestone 
    ? Math.min((totalRevenue / nextMilestone.value) * 100, 100)
    : 100;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value}`;
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Metas</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Acompanhe as metas de faturamento e obtenha recompensas.
        </p>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Roadmap Grid */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[600px] space-y-4">
              {/* Row 1 */}
              <div className="flex items-center gap-2">
                {milestones.filter(m => m.row === 1).sort((a, b) => a.col - b.col).map((milestone, idx, arr) => {
                  const status = getMilestoneStatus(milestone);
                  const isCompleted = status === "completed" || status === "pending" || status === "credited";
                  const isAvailable = milestone.hasBadge && status === "completed";
                  
                  return (
                    <div key={milestone.value} className="flex items-center">
                      <motion.button
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedMilestone(milestone);
                            setShowModal(true);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? "border-primary bg-primary/20"
                            : "border-gray-600 bg-gray-800/50"
                        } ${isAvailable ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                        whileHover={isAvailable ? { scale: 1.05 } : {}}
                      >
                        {milestone.hasBadge && isCompleted ? (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        ) : (
                          <span className={`text-xs sm:text-sm font-bold ${isCompleted ? "text-primary" : "text-gray-500"}`}>
                            {milestone.label}
                          </span>
                        )}
                      </motion.button>
                      {idx < arr.length - 1 && (
                        <div className={`w-8 sm:w-12 h-1 ${
                          getMilestoneStatus(arr[idx + 1]) !== "locked" || isCompleted
                            ? "bg-primary"
                            : "bg-gray-700"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Connecting line down */}
              <div className="flex justify-end pr-10">
                <div className="w-1 h-8 bg-gray-700" />
              </div>

              {/* Row 2 - Reverse order */}
              <div className="flex items-center gap-2 flex-row-reverse">
                {milestones.filter(m => m.row === 2).sort((a, b) => b.col - a.col).map((milestone, idx, arr) => {
                  const status = getMilestoneStatus(milestone);
                  const isCompleted = status === "completed" || status === "pending" || status === "credited";
                  const isAvailable = milestone.hasBadge && status === "completed";
                  
                  return (
                    <div key={milestone.value} className="flex items-center flex-row-reverse">
                      <motion.button
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedMilestone(milestone);
                            setShowModal(true);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? "border-primary bg-primary/20"
                            : "border-gray-600 bg-gray-800/50"
                        } ${isAvailable ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                        whileHover={isAvailable ? { scale: 1.05 } : {}}
                      >
                        {milestone.hasBadge && isCompleted ? (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        ) : (
                          <span className={`text-xs sm:text-sm font-bold ${isCompleted ? "text-primary" : "text-gray-500"}`}>
                            {milestone.label}
                          </span>
                        )}
                      </motion.button>
                      {idx < arr.length - 1 && (
                        <div className={`w-8 sm:w-12 h-1 ${
                          isCompleted ? "bg-primary" : "bg-gray-700"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Connecting line down */}
              <div className="flex pl-10">
                <div className="w-1 h-8 bg-gray-700" />
              </div>

              {/* Row 3 */}
              <div className="flex items-center gap-2">
                {milestones.filter(m => m.row === 3).sort((a, b) => a.col - b.col).map((milestone, idx, arr) => {
                  const status = getMilestoneStatus(milestone);
                  const isCompleted = status === "completed" || status === "pending" || status === "credited";
                  const isAvailable = milestone.hasBadge && status === "completed";
                  
                  return (
                    <div key={milestone.value} className="flex items-center">
                      <motion.button
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedMilestone(milestone);
                            setShowModal(true);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? "border-primary bg-primary/20"
                            : "border-gray-600 bg-gray-800/50"
                        } ${isAvailable ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                        whileHover={isAvailable ? { scale: 1.05 } : {}}
                      >
                        {milestone.hasBadge && isCompleted ? (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        ) : (
                          <span className={`text-xs sm:text-sm font-bold ${isCompleted ? "text-primary" : "text-gray-500"}`}>
                            {milestone.label}
                          </span>
                        )}
                      </motion.button>
                      {idx < arr.length - 1 && (
                        <div className={`w-8 sm:w-12 h-1 ${
                          isCompleted ? "bg-primary" : "bg-gray-700"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progress Panel */}
          <div className="w-full lg:w-72 space-y-4">
            {/* Current Progress Card */}
            <div className="bg-secondary rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-3">Progresso Atual</p>
              
              {/* Achievement Badge */}
              <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${currentLevel.color} flex items-center justify-center mb-4`}>
                <Trophy className="w-12 h-12 text-white/80" />
              </div>
              
              <h3 className="text-lg font-bold text-foreground text-center mb-1">
                {currentLevel.name}
              </h3>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Voce esta so comecando a sua jornada!
              </p>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-primary font-medium">Em Progresso</span>
              </div>

              {/* Progress bar */}
              {nextMilestone && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{formatCurrency(totalRevenue)}</span>
                    <span>{formatCurrency(nextMilestone.value)}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {progressPercent.toFixed(0)}% completo
                  </p>
                </div>
              )}
            </div>

            {/* Simulation Card */}
            <div className="bg-secondary rounded-xl p-4 border border-primary/30">
              <p className="text-primary font-medium mb-2">Simulacao</p>
              <p className="text-xs text-muted-foreground mb-4">
                Clique em &quot;Iniciar Simulacao&quot; para ver como ficaria o caminho ao completar cada recompensa.
              </p>
              <Button 
                onClick={() => {
                  setShowSimulation(true);
                  setCurrentRewardIndex(0);
                }}
                className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Simulacao
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Claim Modal */}
      <AnimatePresence>
        {showModal && selectedMilestone && selectedMilestone.badgeType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Resgatar Premiacao
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {achievementNames[selectedMilestone.badgeType]}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">
                    Parabens por atingir essa meta!
                  </p>
                  <p className="text-lg font-bold text-primary">
                    Meta atingida: {selectedMilestone.label}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Endereco de Entrega *
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, numero, complemento, bairro, cidade, estado, CEP"
                    rows={3}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground resize-none"
                  />
                </div>

                <Button
                  onClick={claimReward}
                  disabled={!address || isClaiming}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isClaiming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Gift className="w-4 h-4 mr-2" />
                  Solicitar Premiacao
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Sua premiacao sera enviada em ate 15 dias uteis apos a solicitacao.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulation Modal */}
      <AnimatePresence>
        {showSimulation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowSimulation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-border p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Simulacao</h3>
                <button
                  onClick={() => {
                    setCurrentRewardIndex(0);
                  }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resetar
                </button>
              </div>

              {/* Active Mode Badge */}
              <div className="bg-gradient-to-r from-primary to-orange-500 text-primary-foreground text-center py-2 px-4 rounded-lg text-sm font-medium mb-6">
                Modo Simulacao Ativo
              </div>

              {/* Reward Display */}
              <div className="flex flex-col items-center mb-6">
                {/* Reward Icon */}
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center mb-4 relative overflow-hidden">
                  {simulationRewards[currentRewardIndex].icon === "bracelet" && (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-4 rounded-full border-4 border-primary bg-primary/20 mb-2" />
                      <span className="text-xs text-primary font-bold">20K</span>
                      <span className="text-[10px] text-muted-foreground">FATURADOS</span>
                    </div>
                  )}
                  {simulationRewards[currentRewardIndex].icon === "plaque" && (
                    <div className="flex flex-col items-center p-2 bg-gradient-to-b from-primary/30 to-primary/10 rounded-lg border border-primary/50">
                      <Award className="w-8 h-8 text-primary mb-1" />
                      <span className="text-lg font-bold text-primary">
                        {simulationRewards[currentRewardIndex].value >= 1000000 
                          ? "1M" 
                          : `${simulationRewards[currentRewardIndex].value / 1000}K`}
                      </span>
                      <span className="text-[8px] text-muted-foreground">FATURADOS</span>
                    </div>
                  )}
                  {simulationRewards[currentRewardIndex].icon === "event" && (
                    <div className="flex flex-col items-center">
                      <Users className="w-10 h-10 text-primary mb-1" />
                      <Star className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                      <Star className="w-3 h-3 text-yellow-500 absolute top-4 left-3" />
                      <span className="text-xs text-primary font-bold">TOP SELLERS</span>
                    </div>
                  )}
                </div>

                {/* Reward Name */}
                <h4 className="text-xl font-bold text-foreground mb-1">
                  {simulationRewards[currentRewardIndex].level}
                </h4>
                <p className="text-sm text-muted-foreground text-center mb-2">
                  {simulationRewards[currentRewardIndex].description}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentRewardIndex(Math.max(0, currentRewardIndex - 1))}
                  disabled={currentRewardIndex === 0}
                  className="flex-1 border-border"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  onClick={() => setCurrentRewardIndex(Math.min(simulationRewards.length - 1, currentRewardIndex + 1))}
                  disabled={currentRewardIndex === simulationRewards.length - 1}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Proxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Progress Indicator */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Recompensa {currentRewardIndex + 1} de {simulationRewards.length}
                </p>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentRewardIndex + 1) / simulationRewards.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
                  />
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                onClick={() => setShowSimulation(false)}
                className="w-full mt-4 text-muted-foreground hover:text-foreground"
              >
                Fechar Simulacao
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
