import { useState, useEffect } from 'react';
import { checkSupabaseConnection } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    setStatus('loading');
    try {
      const isConnected = await checkSupabaseConnection();
      setStatus(isConnected ? 'connected' : 'error');
    } catch (error) {
      console.error('Falha ao verificar conexão:', error);
      setStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={status === 'connected' ? 'default' : 'destructive'}
        className="flex items-center gap-1"
      >
        {status === 'loading' ? (
          <>
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Verificando</span>
          </>
        ) : status === 'connected' ? (
          <>
            <CheckCircle2 className="w-3 h-3" />
            <span>Supabase Conectado</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3" />
            <span>Erro de Conexão</span>
          </>
        )}
      </Badge>
      {status !== 'loading' && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2"
          onClick={checkConnection} 
          disabled={isChecking}
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}