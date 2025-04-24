import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);
  const [location, setLocation] = useLocation();
  const [retrying, setRetrying] = useState(false);

  // Reset error when location changes
  useEffect(() => {
    setError(null);
  }, [location]);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Erro capturado pelo ErrorBoundary:', event.error);
      setError(event.error || new Error('Ocorreu um erro desconhecido'));
      event.preventDefault();
    };

    // Handle unhandled promise rejections (fetch errors, etc)
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Promessa rejeitada capturada pelo ErrorBoundary:', event.reason);
      setError(event.reason || new Error('Ocorreu um erro de conexão'));
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    // Try to reload current page state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  if (error) {
    let errorMessage = "Ocorreu um erro na aplicação.";
    let errorDescription = "Por favor, tente novamente ou contate o suporte.";
    
    // Try to parse different error types
    if (error.message) {
      if (error.message.includes('401')) {
        errorMessage = "Sessão expirada ou não autenticada";
        errorDescription = "Sua sessão pode ter expirado. Por favor, faça login novamente.";
      } else if (error.message.includes('404')) {
        errorMessage = "Recurso não encontrado";
        errorDescription = "A página ou recurso que você está tentando acessar não existe.";
      } else if (error.message.includes('500')) {
        errorMessage = "Erro interno do servidor";
        errorDescription = "Ocorreu um erro no servidor. Tente novamente mais tarde.";
      } else if (error.message.includes('network') || error.message.includes('failed to fetch')) {
        errorMessage = "Erro de conexão";
        errorDescription = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
      }
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle />
              {errorMessage}
            </CardTitle>
            <CardDescription>
              {errorDescription}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Detalhes do erro</AlertTitle>
              <AlertDescription className="text-xs mt-2 break-all">
                {error.message || 'Erro desconhecido'}
              </AlertDescription>
            </Alert>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Página Inicial
            </Button>
            <Button 
              variant="default" 
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recarregando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export default ErrorBoundary;