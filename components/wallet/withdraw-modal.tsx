'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, QrCode, Copy, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRScanner } from './qr-scanner';
import { CopyPasteInput } from './copy-paste-input';
import { calculateWithdrawalFee, formatCurrency } from '@/lib/pix-validator';

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
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPixKey, setWithdrawPixKey] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'qr' | 'paste'>('saved');
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string>(
    savedPixKeys.find((k) => k.is_primary)?.id || savedPixKeys[0]?.id || ''
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Calculate fee when amount changes
  const amount = parseFloat(withdrawAmount) || 0;
  const feeCalculation = calculateWithdrawalFee(amount, systemSettings.withdrawalFeePercentage || 1.5);

  const handleSavedKeySelect = (keyId: string) => {
    setSelectedPixKeyId(keyId);
    const key = savedPixKeys.find((k) => k.id === keyId);
    if (key) {
      setWithdrawPixKey(key.key_value);
    }
  };

  const handleQRScan = (pixKey: string) => {
    console.log('[v0] QR scanned:', pixKey);
    setWithdrawPixKey(pixKey);
    setActiveTab('saved'); // Show summary after scan
    setLocalError(null);
  };

  const handlePasteSubmit = (pixKey: string) => {
    console.log('[v0] PIX key pasted:', pixKey);
    setWithdrawPixKey(pixKey);
    setActiveTab('saved'); // Show summary after paste
    setLocalError(null);
  };

  const handleWithdraw = async () => {
    // Validation
    if (!withdrawAmount || amount <= 0) {
      setLocalError('Informe um valor válido');
      return;
    }

    if (!withdrawPixKey) {
      setLocalError('Selecione uma chave PIX');
      return;
    }

    if (amount < systemSettings.minWithdrawal) {
      setLocalError(`Valor mínimo: ${formatCurrency(systemSettings.minWithdrawal)}`);
      return;
    }

    if (feeCalculation.total > balance) {
      setLocalError('Saldo insuficiente para esta transferência (incluindo taxa)');
      return;
    }

    try {
      await onWithdraw(amount, withdrawPixKey);
      setWithdrawAmount('');
      setWithdrawPixKey('');
      setSelectedPixKeyId('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao processar saque');
    }
  };

  const displayError = localError || error;

  return (
    <div className="space-y-6">
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

      {withdrawSuccess ? (
        <div className="text-center space-y-4 py-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Saque Enviado!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {feeCalculation.amount <= 500
                ? 'Seu saque será processado em breve'
                : 'Seu saque foi enviado para aprovação do administrador'}
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-border">
            {/* Tab: Saved Keys */}
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'saved'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Key className="w-4 h-4" />
              Chave Salva
            </button>

            {/* Tab: QR Scanner */}
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'qr'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>

            {/* Tab: Copy & Paste */}
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'paste'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Copy className="w-4 h-4" />
              Copia e Cola
            </button>
          </div>

          <div className="space-y-4">
            {/* Tab Content: Saved Keys */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                {savedPixKeys.length > 0 ? (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Selecione uma chave PIX salva</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {savedPixKeys.map((key) => (
                        <button
                          key={key.id}
                          onClick={() => handleSavedKeySelect(key.id)}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                            selectedPixKeyId === key.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-secondary hover:border-primary/50'
                          }`}
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
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-500">Nenhuma chave PIX salva. Use QR Code ou Copia e Cola.</p>
                  </div>
                )}

                {/* Amount Input */}
                {withdrawPixKey && (
                  <div className="space-y-2 pt-4 border-t border-border">
                    <label className="text-sm font-medium text-foreground">Valor do saque</label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-secondary border-border"
                      min={systemSettings.minWithdrawal}
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimo: {formatCurrency(systemSettings.minWithdrawal)} | Maximo: {formatCurrency(systemSettings.maxWithdrawal || 50000)}
                    </p>

                    {/* Fee Breakdown */}
                    {amount > 0 && (
                      <div className="p-3 bg-secondary rounded-xl space-y-2 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium text-foreground">{formatCurrency(feeCalculation.amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxa ({systemSettings.withdrawalFeePercentage}%):</span>
                          <span className="font-medium text-primary">{formatCurrency(feeCalculation.fee)}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between text-sm">
                          <span className="font-semibold text-foreground">Total:</span>
                          <span className="font-bold text-primary">{formatCurrency(feeCalculation.total)}</span>
                        </div>
                      </div>
                    )}

                    {/* Withdraw Button */}
                    <Button
                      onClick={handleWithdraw}
                      disabled={loading || !withdrawAmount || !withdrawPixKey}
                      className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processando...
                        </>
                      ) : (
                        `Sacar ${withdrawPixKey ? formatCurrency(feeCalculation.amount) : ''}`
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: QR Scanner */}
            {activeTab === 'qr' && (
              <div className="space-y-4">
                <QRScanner
                  onScan={handleQRScan}
                  onError={(err) => setLocalError(err)}
                  isLoading={loading}
                />
              </div>
            )}

            {/* Tab Content: Copy & Paste */}
            {activeTab === 'paste' && (
              <div className="space-y-4">
                <CopyPasteInput
                  onSubmit={handlePasteSubmit}
                  isLoading={loading}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
