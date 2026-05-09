'use client';

import React, { useRef } from 'react';
import { Download, Share2, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/pix-validator';
import html2canvas from 'html2canvas';

interface WithdrawalReceiptProps {
  withdrawal: {
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    pixKey: string;
    pixKeyType: string;
    recipientName?: string;
    recipientBank?: string;
    status: string;
    createdAt: string;
  };
  onClose: () => void;
}

export function WithdrawalReceipt({ withdrawal, onClose }: WithdrawalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' - ' + date.toLocaleTimeString('pt-BR');
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `comprovante-saque-${withdrawal.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `comprovante-saque-${withdrawal.id.slice(0, 8)}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Comprovante de Saque',
            text: `Comprovante de transferencia PIX - ${formatCurrency(withdrawal.amount)}`,
          });
        } else {
          handleDownload();
        }
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      handleDownload();
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return { label: 'Concluido', color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'pending':
        return { label: 'Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      case 'processing':
        return { label: 'Processando', color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'approved':
        return { label: 'Aprovado', color: 'text-green-500', bg: 'bg-green-500/10' };
      default:
        return { label: status, color: 'text-muted-foreground', bg: 'bg-secondary' };
    }
  };

  const statusInfo = getStatusInfo(withdrawal.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden shadow-2xl">
        {/* Header com botao fechar */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Comprovante</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Conteudo do comprovante */}
        <div ref={receiptRef} className="p-6 bg-gradient-to-b from-card to-background">
          {/* Logo com design melhorado */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-base">LP</span>
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">Legacy</span>
                <span className="text-xl font-bold text-primary">Pay</span>
              </div>
            </div>
          </div>

          {/* Titulo */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-sm">Comprovante de Transferencia via Pix</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-primary/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          </div>

          {/* Valor com destaque */}
          <div className="text-center mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Valor Transferido</p>
            <p className="text-4xl font-bold text-primary">{formatCurrency(withdrawal.amount)}</p>
            <p className="text-muted-foreground text-xs mt-2">
              Transacao efetuada em {formatDate(withdrawal.createdAt)}
            </p>
          </div>

          {/* Destino */}
          <div className="mb-4 p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-green-500 font-semibold text-sm uppercase tracking-wider">Destino</p>
            </div>
            <div className="space-y-3">
              {withdrawal.recipientName && (
                <div>
                  <p className="text-muted-foreground text-xs">Nome</p>
                  <p className="text-foreground font-semibold">{withdrawal.recipientName}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">Chave PIX ({withdrawal.pixKeyType})</p>
                <p className="text-foreground font-medium font-mono text-sm break-all">{withdrawal.pixKey}</p>
              </div>
              {withdrawal.recipientBank && (
                <div>
                  <p className="text-muted-foreground text-xs">Banco</p>
                  <p className="text-foreground font-semibold">{withdrawal.recipientBank}</p>
                </div>
              )}
            </div>
          </div>

          {/* Origem */}
          <div className="mb-4 p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-primary font-semibold text-sm uppercase tracking-wider">Origem</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground text-xs">Nome</p>
                <p className="text-foreground font-semibold">LEGACYPAY PAGAMENTOS LTDA</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Instituicao</p>
                <p className="text-foreground font-medium">LegacyPay Instituicao de Pagamento</p>
              </div>
            </div>
          </div>

          {/* Detalhes da transacao */}
          <div className="p-4 rounded-xl bg-secondary/20 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ID da Transacao</span>
              <span className="text-foreground font-mono text-xs bg-secondary px-2 py-1 rounded">{withdrawal.id.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de Saque</span>
              <span className="text-foreground font-semibold">{formatCurrency(withdrawal.fee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor Liquido</span>
              <span className="text-green-500 font-semibold">{formatCurrency(withdrawal.netAmount)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Icone de sucesso */}
          {(withdrawal.status === 'completed' || withdrawal.status === 'paid') && (
            <div className="flex justify-center mt-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center border border-green-500/30">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
            </div>
          )}

          {/* Rodape */}
          <p className="text-center text-muted-foreground text-xs mt-4">
            Documento gerado automaticamente pelo sistema LegacyPay
          </p>
        </div>

        {/* Botoes de acao */}
        <div className="p-4 border-t border-border flex gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
          <Button
            onClick={handleShare}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>
    </div>
  );
}
