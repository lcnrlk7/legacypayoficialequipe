'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, QrCode, Copy, Key, ArrowLeft, Wallet, User, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRScanner } from './qr-scanner';
import { CopyPasteInput } from './copy-paste-input';
import { calculateWithdrawalFee, formatCurrency, detectPixKeyType, parsePixQRCode, PIXQRCodeData } from '@/lib/pix-validator';

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
type Tab = 'saved' | 'qr' | 'paste';

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
  const [pixData, setPixData] = useState<PIXQRCodeData | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Calculate fee when amount changes
  const amount = parseFloat(withdrawAmount) || 0;
  const feePercentage = systemSettings.withdrawalFeePercentage || 1.5;
  const feeCalculation = calculateWithdrawalFee(amount, feePercentage);

  // Handle saved key selection - go directly to confirm
  const handleSavedKeySelect = (key: PixKey) => {
    setWithdrawPixKey(key.key_value);
    setPixKeyType(key.key_type.toUpperCase());
    setPixData(null);
    setLocalError(null);
    setStep('confirm');
  };

  // Handle QR scan - parse QR code and go to confirm
  const handleQRScan = (qrCodeData: string) => {
    console.log('[v0] QR scanned:', qrCodeData);
    
    // Parse the QR code
    const parsed = parsePixQRCode(qrCodeData);
    console.log('[v0] Parsed QR:', parsed);
    
    if (parsed.isValid) {
      setWithdrawPixKey(parsed.pixKey);
      setPixKeyType(parsed.keyType);
      setPixData(parsed);
      
      // If QR has amount, pre-fill it
      if (parsed.amount && parsed.amount > 0) {
        setWithdrawAmount(parsed.amount.toString());
      }
      
      setLocalError(null);
      setStep('confirm');
    } else {
      // Maybe it's just a PIX key
      const keyType = detectPixKeyType(qrCodeData);
      if (keyType && keyType !== 'DESCONHECIDO') {
        setWithdrawPixKey(qrCodeData);
        setPixKeyType(keyType);
        setPixData(null);
        setLocalError(null);
        setStep('confirm');
      } else {
        setLocalError('QR Code invalido. Tente novamente.');
      }
    }
  };

  // Handle paste - parse and go to confirm
  const handlePasteSubmit = (pastedData: string) => {
    console.log('[v0] PIX data pasted:', pastedData);
    
    // Check if it's a QR code string or just a key
    if (pastedData.startsWith('000201')) {
      // It's a QR code string
      const parsed = parsePixQRCode(pastedData);
      console.log('[v0] Parsed pasted QR:', parsed);
      
      if (parsed.isValid) {
        setWithdrawPixKey(parsed.pixKey);
        setPixKeyType(parsed.keyType);
        setPixData(parsed);
        
        if (parsed.amount && parsed.amount > 0) {
          setWithdrawAmount(parsed.amount.toString());
        }
        
        setLocalError(null);
        setStep('confirm');
        return;
      }
    }
    
    // It's just a PIX key
    const keyType = detectPixKeyType(pastedData);
    setWithdrawPixKey(pastedData);
    setPixKeyType(keyType || 'PIX');
    setPixData({
      pixKey: pastedData,
      keyType: keyType || 'PIX',
      isValid: true,
    });
    setLocalError(null);
    setStep('confirm');
  };

  // Go back to selection
  const handleBack = () => {
    setStep('select');
    setWithdrawAmount('');
    setPixData(null);
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
      setLocalError(`Valor minimo: ${formatCurrency(systemSettings.minWithdrawal || 3)}`);
      return;
    }

    if (feeCalculation.total > balance) {
      setLocalError('Saldo insuficiente para esta transferencia (incluindo taxa)');
      return;
    }

    try {
      await onWithdraw(amount, withdrawPixKey);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao processar saque');
    }
  };

  const displayError = localError || error;
  const minWithdrawal = systemSettings.minWithdrawal || 3;
  const maxWithdrawal = systemSettings.maxWithdrawal || 50000;

  // Success state
  if (withdrawSuccess) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Saque Enviado!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {amount <= 500
              ? 'Seu saque sera processado em breve'
              : 'Seu saque foi enviado para aprovacao do administrador'}
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
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Key className="w-4 h-4" />
              Chave Salva
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'paste'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Copy className="w-4 h-4" />
              Copia e Cola
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[250px]">
            {/* Saved Keys */}
            {activeTab === 'saved' && (
              <div className="space-y-3">
                {savedPixKeys.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-foreground">Selecione uma chave PIX salva</p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {savedPixKeys.map((key) => (
                        <button
                          key={key.id}
                          onClick={() => handleSavedKeySelect(key)}
                          className="w-full p-3 rounded-xl border-2 border-border bg-secondary hover:border-primary/50 text-left transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{key.key_type.toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground font-mono">{key.key_value}</p>
                            </div>
                            {key.is_primary && (
                              <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded">
                                Principal
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                    <p className="text-sm text-yellow-500">Nenhuma chave PIX salva.</p>
                    <p className="text-xs text-muted-foreground mt-1">Use QR Code ou Copia e Cola.</p>
                  </div>
                )}
              </div>
            )}

            {/* QR Scanner */}
            {activeTab === 'qr' && (
              <QRScanner
                onScan={handleQRScan}
                onError={(err) => setLocalError(err)}
                isLoading={loading}
              />
            )}

            {/* Copy & Paste */}
            {activeTab === 'paste' && (
              <CopyPasteInput
                onSubmit={handlePasteSubmit}
                isLoading={loading}
              />
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

          {/* PIX Data Card - Similar to receipt */}
          <div className="p-4 bg-secondary rounded-xl border border-border space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm font-medium text-foreground">Dados do Destinatario</span>
              <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded">
                {pixKeyType}
              </span>
            </div>
            
            {/* Beneficiary Name */}
            {pixData?.name && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium text-foreground">{pixData.name}</p>
                </div>
              </div>
            )}
            
            {/* City */}
            {pixData?.city && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cidade</p>
                  <p className="font-medium text-foreground">{pixData.city}</p>
                </div>
              </div>
            )}
            
            {/* PIX Key */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Key className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Chave PIX ({pixKeyType})</p>
                <p className="font-mono text-sm text-foreground truncate">{withdrawPixKey}</p>
              </div>
            </div>
            
            {/* Description */}
            {pixData?.description && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Descricao</p>
                  <p className="font-medium text-foreground">{pixData.description}</p>
                </div>
              </div>
            )}
            
            {/* QR Code Amount (if present) */}
            {pixData?.amount && pixData.amount > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor do QR Code:</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(pixData.amount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {pixData?.amount ? 'Valor a transferir (pre-definido pelo QR)' : 'Valor do saque'}
            </label>
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
                max={maxWithdrawal}
                step="0.01"
                autoFocus
                readOnly={!!(pixData?.amount && pixData.amount > 0)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimo: {formatCurrency(minWithdrawal)} | Maximo: {formatCurrency(maxWithdrawal)}
            </p>
          </div>

          {/* Fee Breakdown */}
          {amount > 0 && (
            <div className="p-4 bg-secondary rounded-xl space-y-3 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor do saque:</span>
                <span className="font-medium text-foreground">{formatCurrency(feeCalculation.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa ({feePercentage}%):</span>
                <span className="font-medium text-red-400">- {formatCurrency(feeCalculation.fee)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold text-foreground">Destinatario recebe:</span>
                <span className="font-bold text-xl text-primary">
                  {formatCurrency(feeCalculation.amount - feeCalculation.fee)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total debitado do saldo:</span>
                <span>{formatCurrency(feeCalculation.total)}</span>
              </div>
            </div>
          )}

          {/* Withdraw Button */}
          <Button
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount || amount <= 0 || feeCalculation.total > balance}
            className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Confirmar Saque
              </>
            )}
          </Button>

          {feeCalculation.total > balance && amount > 0 && (
            <p className="text-xs text-center text-red-400">
              Saldo insuficiente. Voce precisa de {formatCurrency(feeCalculation.total)} (incluindo taxa).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
