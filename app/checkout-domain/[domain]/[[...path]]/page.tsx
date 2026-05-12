'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckoutPage } from '@/app/pay/[slug]/checkout-page';

interface CheckoutData {
  id: string;
  name: string;
  slug: string;
  custom_domain?: string;
  products?: any[];
  [key: string]: any;
}

export default function DomainCheckoutPage() {
  const params = useParams();
  const domain = params.domain as string;
  const path = (params.path as string[]) || [];
  
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadCheckout() {
      try {
        // Busca checkout pelo dominio personalizado
        const response = await fetch(`/api/checkout/by-domain?domain=${encodeURIComponent(domain)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Checkout nao encontrado para este dominio');
          } else {
            setError('Erro ao carregar checkout');
          }
          return;
        }
        
        const data = await response.json();
        setCheckout(data);
      } catch (err) {
        setError('Erro ao conectar com o servidor');
      } finally {
        setLoading(false);
      }
    }
    
    loadCheckout();
  }, [domain]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !checkout) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Checkout nao encontrado</h1>
          <p className="text-gray-400">{error || 'Este dominio nao esta configurado.'}</p>
        </div>
      </div>
    );
  }
  
  return <CheckoutPage checkout={checkout as any} />;
}
