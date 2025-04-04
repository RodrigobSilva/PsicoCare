import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-neutral-800">Página Não Encontrada</h1>
            <p className="mt-2 text-sm text-neutral-600">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>
          
          <div className="flex justify-center mt-6">
            <Link href="/">
              <Button>Voltar para o Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
