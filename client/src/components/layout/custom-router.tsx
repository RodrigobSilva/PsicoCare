import { useEffect } from 'react';
import { useLocation, Router } from 'wouter';

// Este componente envolve o Router do wouter para adicionar tratamento de 404 e outras funcionalidades
export function CustomRouter({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  // Detecta quando carrega em uma URL diretamente e garante que a navegação funcione
  useEffect(() => {
    // Se a página for carregada diretamente em uma rota que não é a raiz
    // O Netlify já deve redirecionar para index.html graças ao _redirects
    // Mas podemos adicionar lógica extra aqui se necessário
    console.log('Página carregada em:', location);
  }, []);

  // Adiciona event listener para capturar cliques em links e prevenir 404
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Se o clique for em um link interno
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && 
          anchor.href && 
          anchor.href.startsWith(window.location.origin) && 
          !anchor.href.includes('/api/')) {
        
        e.preventDefault();
        
        // Extract the path from the URL
        const path = anchor.href.replace(window.location.origin, '');
        
        // Use o hook de navegação do wouter
        setLocation(path);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [setLocation]);

  return (
    <Router>{children}</Router>
  );
}

export default CustomRouter;