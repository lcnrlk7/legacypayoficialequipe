'use client';

import React, { useState } from 'react';
import { validatePixKey, parsePixQRCode } from '@/lib/pix-validator';

interface CopyPasteInputProps {
  onSubmit: (pixKey: string) => void;
  isLoading?: boolean;
}

export function CopyPasteInput({ onSubmit, isLoading }: CopyPasteInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [validation, setValidation] = useState<any>(null);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setError('');
    setValidation(null);

    const pastedText = e.clipboardData.getData('text');
    setInput(pastedText);

    // Validate immediately after paste
    validateInput(pastedText);
  };

  const validateInput = (value: string) => {
    if (!value.trim()) {
      setError('');
      setValidation(null);
      return;
    }

    const trimmed = value.trim();
    
    // Check if it's a QR code first
    if (trimmed.startsWith('000201') || trimmed.includes('br.gov.bcb.pix')) {
      const qrData = parsePixQRCode(trimmed);
      setValidation({
        isValid: true,
        type: 'qrcode',
        key: trimmed,
        qrData: qrData.isValid ? qrData : null,
      });
      setError('');
      return;
    }

    const result = validatePixKey(value);

    if (result.isValid) {
      setValidation({
        isValid: true,
        type: result.type,
        key: result.formattedKey || value,
      });
      setError('');
    } else {
      setValidation(null);
      setError(result.error || 'Chave PIX invalida');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    validateInput(value);
  };

  const handleSubmit = () => {
    if (!validation?.isValid) {
      setError('Por favor, insira uma chave PIX válida');
      return;
    }

    console.log('[v0] Submitting PIX key:', validation.key);
    onSubmit(validation.key);
  };

  const getTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      email: 'Email',
      phone: 'Telefone',
      random: 'Chave Aleatoria',
      qrcode: 'QR Code PIX',
    };
    return labels[type || ''] || 'Chave PIX';
  };

  return (
    <div className="w-full space-y-4">
      {/* Input area */}
      <div className="space-y-2">
        <label htmlFor="pix-paste" className="block text-sm font-medium text-gray-700">
          Cole a chave PIX ou código completo
        </label>
        <textarea
          id="pix-paste"
          value={input}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="Cole uma chave PIX aqui (CPF, CNPJ, email, telefone, chave aleatória ou código PIX completo)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[100px] font-mono text-sm"
        />
      </div>

      {/* Validation result */}
      {validation?.isValid && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                {validation.type === 'qrcode' ? 'QR Code PIX valido' : 'Chave valida'}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Tipo: <span className="font-semibold">{getTypeLabel(validation.type)}</span>
              </p>
              {validation.qrData?.name && (
                <p className="text-xs text-green-700 mt-1">
                  Destinatario: <span className="font-semibold">{validation.qrData.name}</span>
                </p>
              )}
              {validation.qrData?.amount && validation.qrData.amount > 0 && (
                <p className="text-xs text-green-700 mt-1">
                  Valor: <span className="font-semibold">R$ {validation.qrData.amount.toFixed(2).replace('.', ',')}</span>
                </p>
              )}
              {validation.type !== 'qrcode' && (
                <p className="text-xs text-green-700 font-mono break-all mt-1">{validation.key}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-blue-900 mb-2">Formatos aceitos:</p>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>CPF: 123.456.789-10</li>
          <li>CNPJ: 12.345.678/0001-99</li>
          <li>Email: exemplo@email.com</li>
          <li>Telefone: (11) 98765-4321</li>
          <li>Chave aleatória: UUID format</li>
          <li>Código PIX completo: Comece com 00020126</li>
        </ul>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !validation?.isValid}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all"
      >
        {isLoading ? 'Processando...' : 'Usar esta chave PIX'}
      </button>
    </div>
  );
}
