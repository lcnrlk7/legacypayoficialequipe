'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, Key, ArrowLeft, Wallet, Mail, Phone, CreditCard, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateWithdrawalFee, formatCurrency, validatePixKey } from '@/lib/pix-validator';

interface PixKey {
  id: string;
  key_type: string;
  key_value: string;
  is_primary: boolean;
}

interface WithdrawModalProps {
  balance: number;
  savedPixKeys: PixKey[];
  systemSettings: any;
  loading: boolean;
  error: string | null;
  withdrawSuccess: boolean;
  onWithdraw: (amount: number, pixKey: string) => Promise<void>;
  onClose: () => void;
}

type Step = 'select' | 'confirm';
type Tab = 'saved' | 'manual';

const keyTypeIcons: Record<string, React.ReactNode> = {
  cpf: <CreditCard className="w-4 h-4" />,
  cnpj: <CreditCard className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  telefone: <Phone className="w-4 h-4" />,
  random: <Hash className="w-4 h-4" />,
  aleatoria: <Hash className="w-4 h-4" />,
};

export function WithdrawModal({
  balance,
  savedPixKeys,
  systemSettings,
  loading,
  error,
  withdrawSuccess,
  onWithdraw,
  onClose,
}: WithdrawModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPixKey, setWithdrawPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('');
  const [manualKeyType, setManualKeyType] = useState('cpf');
  const [manualKeyValue, setManualKeyValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Calculate fee when amount changes
  const amount = parseFloat(withdrawAmount) || 0;
  // Taxa fixa de saque (usa taxa do usuario ou padrao)
  const withdrawalFee = systemSettings.withdrawalFee;
  const feeCalculation = calculateWithdrawalFee(amount, 0, withdrawalFee);

  // Handle saved key selection - go directly to confirm
  const handleSavedKeySelect = (key: PixKey) => {
    setWithdrawPixKey(key.key_value);
    setPixKeyType(key.key_type.toUpperCase());
    setLocalError(null);
    setStep('confirm');
  };

  // Handle manual key submission
  const handleManualSubmit = () => {
    if (!manualKeyValue.trim()) {
      setLocalError('Digite a chave PIX');
      return;
    }

    // Validate the key
    const validation = validatePixKey(manualKeyValue.trim());
    if (!validation.isValid) {
      setLocalError(validation.error || 'Chave PIX invalida');
      return;
    }

    setWithdrawPixKey(manualKeyValue.trim());
    setPixKeyType(manualKeyType.toUpperCase());
    setLocalError(null);
    setStep('confirm');
  };

  // Go back to selection
  const handleBack = () => {
    setStep('select');
    setWithdrawAmount('');
    setLocalError(null);
  };

  // Process withdrawal
  const handleWithdraw = async () => {
    // Validation
    if (!withdrawAmount || amount <= 0) {
      setLocalError('Informe um valor valido');
      return;
    }

    if (!withdrawPixKey) {
      setLocalError('Selecione uma chave PIX');
      return;
    }

    if (amount < (systemSettings.minWithdrawal || 3)) {
      setLocalError(`Valor minimo para receber: ${formatCurrency(systemSettings.minWithdrawal || 3)}`);
      return;
    }

    // Verificar se o saldo cobre o valor + taxa
    if (totalDebit > balance) {
      setLocalError(`Saldo insuficiente. Para receber ${formatCurrency(amount)}, voce precisa de ${formatCurrency(totalDebit)} (valor + taxa de ${formatCurrency(withdrawalFee)})`);
      return;
    }

    if (amount <= 0) {
      setLocalError('Informe um valor valido para receber');
      return;
    }

    try {
      await onWithdraw(amount, withdrawPixKey);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao processar saque');
    }
  };

  const displayError = localError || error;
  const minWithdrawal = systemSettings.minWithdrawal || 25;
  const maxWithdrawal = systemSettings.maxWithdrawal || 50000;
  
  // Valor máximo que o usuário pode RECEBER = saldo - taxa de saque
  const maxReceivable = Math.max(0, balance - withdrawalFee);
  // Total que será debitado do saldo = valor que quer receber + taxa
  const totalDebit = amount + withdrawalFee;

  // Success state
  if (withdrawSuccess) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Saque Solicitado!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Valor: {formatCurrency(amount)}
          </p>
          <p className="text-sm text-muted-foreground">
            Chave: {withdrawPixKey}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {amount <= 500
              ? 'Seu saque sera processado em breve'
              : 'Seu saque foi enviado para aprovacao'}
          </p>
        </div>
        <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90">
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Info */}
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
        <p className="text-sm text-primary mb-1">Saldo disponivel</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {displayError}
        </div>
      )}

      {/* Step: Select PIX Key */}
      {step === 'select' && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Key className="w-4 h-4" />
              Chaves Salvas
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-4 h-4" />
              Digitar Chave
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[250px]">
            {/* Saved Keys */}
            {activeTab === 'saved' && (
              <div className="space-y-3">
                {savedPixKeys.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-foreground">Selecione uma chave PIX</p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {savedPixKeys.map((key) => (
                        <button
                          key={key.id}
                          onClick={() => handleSavedKeySelect(key)}
                          className="w-full p-3 rounded-xl border-2 border-border bg-secondary hover:border-primary/50 text-left transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {keyTypeIcons[key.key_type.toLowerCase()] || <Key className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{key.key_type.toUpperCase()}</p>
                                {key.is_primary && (
                                  <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded">
                                    Principal
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-mono truncate">{key.key_value}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-6 bg-secondary rounded-xl text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Key className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhuma chave PIX salva</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique em &quot;Digitar Chave&quot; para inserir uma nova
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Manual Input */}
            {activeTab === 'manual' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyType" className="text-sm font-medium">Tipo de Chave</Label>
                  <Select value={manualKeyType} onValueChange={setManualKeyType}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          CPF
                        </div>
                      </SelectItem>
                      <SelectItem value="cnpj">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          CNPJ
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="telefone">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Telefone
                        </div>
                      </SelectItem>
                      <SelectItem value="aleatoria">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Chave Aleatoria
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyValue" className="text-sm font-medium">Chave PIX</Label>
                  <Input
                    id="keyValue"
                    placeholder={
                      manualKeyType === 'cpf' ? '000.000.000-00' :
                      manualKeyType === 'cnpj' ? '00.000.000/0000-00' :
                      manualKeyType === 'email' ? 'email@exemplo.com' :
                      manualKeyType === 'telefone' ? '+55 11 99999-9999' :
                      'Chave aleatoria'
                    }
                    value={manualKeyValue}
                    onChange={(e) => {
                      setManualKeyValue(e.target.value);
                      setLocalError(null);
                    }}
                    className="bg-secondary border-border"
                  />
                </div>

                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualKeyValue.trim()}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Continuar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Confirm Payment */}
      {step === 'confirm' && (
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {/* PIX Key Card */}
          <div className="p-4 bg-secondary rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Transferir para</span>
              <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded">
                {pixKeyType}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                {keyTypeIcons[pixKeyType.toLowerCase()] || <Key className="w-5 h-5 text-green-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-foreground break-all">{withdrawPixKey}</p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Quanto voce quer receber?</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                placeholder="0,00"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setLocalError(null);
                }}
                className="pl-10 bg-secondary border-border text-lg h-12"
                min={minWithdrawal}
                max={maxReceivable}
                step="0.01"
                autoFocus
              />
            </div>
            <div className="space-y-2 mt-3">
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Para sacar tudo, coloque: {formatCurrency(maxReceivable)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa de saque: {formatCurrency(withdrawalFee)} | Minimo: {formatCurrency(minWithdrawal)}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          {amount > 0 && (
            <div className="p-4 bg-secondary rounded-xl space-y-3 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Voce recebe:</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de saque:</span>
                <span className="font-medium text-red-400">+ {formatCurrency(withdrawalFee)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold text-foreground">Total debitado do saldo:</span>
                <span className={`font-bold text-lg ${totalDebit <= balance ? 'text-foreground' : 'text-red-400'}`}>
                  {formatCurrency(totalDebit)}
                </span>
              </div>
              {totalDebit > balance && (
                <p className="text-xs text-red-400">
                  Saldo insuficiente! Voce precisa de {formatCurrency(totalDebit)} mas tem apenas {formatCurrency(balance)}
                </p>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <Button
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount || amount <= 0}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Confirmar Saque
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
