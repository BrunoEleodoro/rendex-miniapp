'use client';

import { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAvenia } from '../../hooks/useAvenia';

interface AveniaLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const AveniaLoginModal = ({ isOpen, onClose, onSuccess }: AveniaLoginModalProps) => {
  const [step, setStep] = useState<'login' | 'validate'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailToken, setEmailToken] = useState('');
  const [error, setError] = useState('');
  
  const { login, validateLogin, loading } = useAvenia();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      setStep('validate');
    } catch (err: any) {
      setError(err.message || 'Login falhou');
    }
  };

  const handleValidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const user = await validateLogin(email, emailToken);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Validação falhou');
    }
  };

  const handleClose = () => {
    setStep('login');
    setEmail('');
    setPassword('');
    setEmailToken('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {step === 'login' ? 'Login no Avenia' : 'Verificar Email'}
            </h2>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@provedor.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Enviando Email...' : 'Enviar Token por Email'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleValidateLogin} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Enviamos um código de verificação para <strong>{email}</strong>. 
                Verifique seu email e digite o código de 6 dígitos abaixo.
              </p>
              
              <div>
                <Label htmlFor="emailToken">Token do Email</Label>
                <Input
                  id="emailToken"
                  type="text"
                  value={emailToken}
                  onChange={(e) => setEmailToken(e.target.value)}
                  placeholder="Digite o código de 6 dígitos"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('login')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Verificando...' : 'Verificar e Fazer Login'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
};