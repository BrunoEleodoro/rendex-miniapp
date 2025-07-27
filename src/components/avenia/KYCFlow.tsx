'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { useAvenia } from '../../hooks/useAvenia';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface KYCFlowProps {
  userId: string;
  onKYCComplete: () => void;
  subaccountId?: string;
}

export const KYCFlow = ({ userId, onKYCComplete, subaccountId }: KYCFlowProps) => {
  const [kycStatus, setKycStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'rejected'>('not_started');
  const [kycUrl, setKycUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [realTimeMessage, setRealTimeMessage] = useState<string>('');
  
  const { initiateKYC, loading } = useAvenia();

  // Set up real-time updates via SSE
  const { isConnected, lastUpdate: _lastUpdate, connectionError } = useRealTimeUpdates({
    userId,
    onKYCUpdate: (update) => {
      console.log(`[KYCFlow] Real-time KYC update received:`, update);
      
      if (update.kycStatus) {
        console.log(`[KYCFlow] Updating KYC status: ${kycStatus} → ${update.kycStatus}`);
        setKycStatus(update.kycStatus as any);
      }
      
      if (update.message) {
        setRealTimeMessage(update.message);
        console.log(`[KYCFlow] Real-time message: ${update.message}`);
      }
      
      // Clear any previous errors when we get a real-time update
      setError('');
      
      // Call completion handler if KYC is completed
      if (update.kycStatus === 'completed' && update.result === 'APPROVED') {
        console.log(`[KYCFlow] KYC completed via real-time update, calling onKYCComplete`);
        setTimeout(onKYCComplete, 2000); // Small delay to show success message
      }
    },
    autoReconnect: true
  });

  const handleStartKYC = async () => {
    console.log(`[KYCFlow] Starting KYC process for user: ${userId}${subaccountId ? ` (subaccount: ${subaccountId})` : ''}`);
    setError('');
    
    try {
      console.log(`[KYCFlow] Calling initiateKYC hook for user: ${userId}`);
      const url = await initiateKYC(userId, subaccountId);
      
      console.log(`[KYCFlow] KYC URL received: ${url}`);
      setKycUrl(url);
      setKycStatus('in_progress');
      
      // Open KYC URL in new window
      console.log(`[KYCFlow] Opening KYC window for user: ${userId}`);
      const kycWindow = window.open(url, '_blank', 'width=800,height=600');
      
      if (kycWindow) {
        console.log(`[KYCFlow] KYC window opened successfully for user: ${userId}`);
      } else {
        console.warn(`[KYCFlow] Failed to open KYC window - popup blocked? User: ${userId}`);
      }
      
      // Set up webhook listener instead of polling
      console.log(`[KYCFlow] KYC process initiated - status will be updated via webhooks for user: ${userId}`);
      setupWebhookListener();
      
    } catch (err: any) {
      console.error(`[KYCFlow] KYC initiation failed for user ${userId}:`, err.message);
      setError(err.message || 'Falha ao iniciar KYC');
    }
  };

  const setupWebhookListener = () => {
    console.log(`[KYCFlow] Setting up webhook listener for KYC updates - user: ${userId}`);
    
    // Listen for messages from the KYC success page
    const handleMessage = (event: MessageEvent) => {
      console.log(`[KYCFlow] Received message from KYC window:`, event.data);
      
      if (event.data.type === 'KYC_COMPLETED') {
        console.log(`[KYCFlow] KYC completion message received for user: ${userId}`);
        setKycStatus('completed');
        window.removeEventListener('message', handleMessage);
      } else if (event.data.type === 'KYC_REJECTED') {
        console.log(`[KYCFlow] KYC rejection message received for user: ${userId}`);
        setKycStatus('rejected');
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Clean up listener after 15 minutes (reasonable timeout)
    setTimeout(() => {
      console.log(`[KYCFlow] Cleaning up webhook listener after timeout for user: ${userId}`);
      window.removeEventListener('message', handleMessage);
    }, 15 * 60 * 1000);
  };

  const getKYCStatusMessage = () => {
    switch (kycStatus) {
      case 'not_started':
        return 'Complete sua verificação de identidade para acessar todos os recursos do RendeX.';
      case 'in_progress':
        return 'Sua verificação KYC está em andamento. Complete o processo na janela aberta.';
      case 'completed':
        return 'Sua identidade foi verificada com sucesso!';
      case 'rejected':
        return 'Sua verificação de identidade foi rejeitada. Entre em contato com o suporte para assistência.';
      default:
        return '';
    }
  };

  const getKYCStatusColor = () => {
    switch (kycStatus) {
      case 'not_started':
        return 'text-blue-600';
      case 'in_progress':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Verificação de Identidade (KYC)</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getKYCStatusColor()} bg-gray-100`}>
          {kycStatus.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      <p className={`mb-4 ${getKYCStatusColor()}`}>
        {getKYCStatusMessage()}
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {realTimeMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {realTimeMessage}
        </div>
      )}

      {connectionError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Atualizações em tempo real desconectadas: {connectionError}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600">
          {isConnected ? 'Atualizações em tempo real conectadas' : 'Atualizações em tempo real desconectadas'}
        </span>
      </div>

      {kycStatus === 'not_started' && (
        <Button
          onClick={handleStartKYC}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Iniciando KYC...' : 'Iniciar Verificação de Identidade'}
        </Button>
      )}

      {kycStatus === 'in_progress' && (
        <div className="space-y-3">
          <Button
            onClick={() => window.open(kycUrl, '_blank')}
            variant="outline"
            className="w-full"
          >
            Reabrir Janela de Verificação
          </Button>
          <p className="text-sm text-gray-600 text-center">
            Complete o processo de verificação e esta página será atualizada automaticamente.
          </p>
        </div>
      )}

      {kycStatus === 'completed' && (
        <Button
          onClick={onKYCComplete}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Continuar para o RendeX
        </Button>
      )}

      {kycStatus === 'rejected' && (
        <div className="space-y-3">
          <Button
            onClick={handleStartKYC}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Tentando KYC novamente...' : 'Tentar Verificação Novamente'}
          </Button>
          <p className="text-sm text-gray-600 text-center">
            Se você continuar tendo problemas, entre em contato com nossa equipe de suporte.
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">O que você precisará:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• RG brasileiro válido, Passaporte ou CNH</li>
          <li>• Seu CPF (documento de identificação fiscal brasileiro)</li>
          <li>• Informações do endereço atual</li>
          <li>• 5-10 minutos para completar o processo</li>
        </ul>
      </div>
    </div>
  );
};