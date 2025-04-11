import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Download, FileWarning, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Modelo de dados esperado da planilha
interface ImportPatientData {
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  genero?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  planoSaudeNome?: string;
  numeroCarteirinha?: string;
  dataValidade?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface ImportPatientsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planosSaude: any[];
  onSuccess: () => void;
}

export default function ImportPatients({ open, onOpenChange, planosSaude = [], onSuccess }: ImportPatientsProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportPatientData[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, successful: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }

    // Verificar extensão do arquivo
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (fileExt !== 'csv') {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  // Parse CSV file
  const parseFile = (file: File) => {
    setProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ImportPatientData[];
        setParsedData(data);
        validateData(data);
        setProcessing(false);
        setActiveTab("review");
      },
      error: (error) => {
        console.error("Erro ao processar arquivo:", error);
        toast({
          title: "Erro ao processar arquivo",
          description: "Não foi possível ler o arquivo. Verifique se o formato está correto.",
          variant: "destructive"
        });
        setProcessing(false);
      }
    });
  };

  // Validate imported data
  const validateData = (data: ImportPatientData[]) => {
    const validationResults = data.map(row => {
      const errors: string[] = [];
      
      // Validar campos obrigatórios
      if (!row.nome || row.nome.trim() === "") {
        errors.push("Nome é obrigatório");
      }
      
      if (!row.email || row.email.trim() === "") {
        errors.push("Email é obrigatório");
      } else if (!isValidEmail(row.email)) {
        errors.push("Email inválido");
      }
      
      // Validar CPF, se fornecido
      if (row.cpf && !isValidCPF(row.cpf)) {
        errors.push("CPF inválido");
      }
      
      // Validar data de nascimento, se fornecida
      if (row.dataNascimento && !isValidDate(row.dataNascimento)) {
        errors.push("Data de nascimento inválida");
      }
      
      // Validar plano de saúde, se fornecido
      if (row.planoSaudeNome) {
        const planoExists = planosSaude.find(p => 
          p.nome.toLowerCase() === row.planoSaudeNome?.toLowerCase()
        );
        
        if (!planoExists) {
          errors.push(`Plano de saúde "${row.planoSaudeNome}" não encontrado`);
        }
        
        // Se tem plano, precisa ter carteirinha e validade
        if (!row.numeroCarteirinha) {
          errors.push("Número da carteirinha é obrigatório quando plano de saúde é informado");
        }
        
        if (!row.dataValidade) {
          errors.push("Data de validade é obrigatória quando plano de saúde é informado");
        } else if (!isValidDate(row.dataValidade)) {
          errors.push("Data de validade do plano inválida");
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    });
    
    setValidationResults(validationResults);
  };

  // Download template CSV
  const downloadTemplate = () => {
    const headers = "nome,email,telefone,cpf,dataNascimento,genero,endereco,cidade,estado,cep,observacoes,planoSaudeNome,numeroCarteirinha,dataValidade\n";
    const sampleRow = "Maria Silva,maria@email.com,(11)98765-4321,12345678900,1990-05-15,Feminino,Rua das Flores 123,São Paulo,SP,01234-567,Observações gerais,Unimed,123456789,2025-12-31\n";
    
    const csv = headers + sampleRow;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'modelo_importacao_pacientes.csv');
  };

  // Process import
  const importMutation = useMutation({
    mutationFn: async (data: ImportPatientData[]) => {
      const results = { total: data.length, successful: 0, failed: 0 };
      const importPromises = data.map(async (patientData, index) => {
        try {
          // Verificar se tem plano de saúde
          let planoSaudeId = null;
          if (patientData.planoSaudeNome) {
            const plano = planosSaude.find(p => 
              p.nome.toLowerCase() === patientData.planoSaudeNome?.toLowerCase()
            );
            if (plano) {
              planoSaudeId = plano.id;
            }
          }

          // Preparar dados para API
          const payload = {
            usuario: {
              nome: patientData.nome,
              email: patientData.email,
              telefone: patientData.telefone || null,
              cpf: patientData.cpf || null,
              ativo: true,
              tipo: "paciente",
            },
            paciente: {
              dataNascimento: patientData.dataNascimento || null,
              genero: patientData.genero || null,
              endereco: patientData.endereco || null,
              cidade: patientData.cidade || null,
              estado: patientData.estado || null,
              cep: patientData.cep || null,
              observacoes: patientData.observacoes || null
            },
            planoSaude: planoSaudeId ? {
              planoSaudeId,
              numeroCarteirinha: patientData.numeroCarteirinha,
              dataValidade: patientData.dataValidade
            } : null
          };

          // Verificar validação antes de enviar
          if (!validationResults[index].valid) {
            results.failed++;
            return { success: false, error: validationResults[index].errors.join(", ") };
          }

          // Enviar para API
          const res = await apiRequest("POST", "/api/pacientes", payload);
          
          if (!res.ok) {
            const errorData = await res.json();
            results.failed++;
            return { success: false, error: errorData.mensagem || "Erro ao criar paciente" };
          }

          results.successful++;
          return { success: true };
        } catch (error) {
          console.error(`Erro ao importar paciente ${patientData.nome}:`, error);
          results.failed++;
          return { success: false, error: "Erro de conexão" };
        }
      });

      // Aguardar conclusão de todas as importações
      await Promise.all(importPromises);
      
      return results;
    },
    onSuccess: (results) => {
      setImportStats(results);
      setActiveTab("results");
      queryClient.invalidateQueries({ queryKey: ["/api/pacientes"] });
    },
    onError: (error) => {
      console.error("Erro durante importação:", error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao processar a importação. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Handle import submission
  const handleImport = () => {
    if (parsedData.length === 0) {
      toast({
        title: "Nenhum dado para importar",
        description: "Por favor, faça upload de um arquivo com dados válidos.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se todos os dados são válidos
    const hasInvalidData = validationResults.some(result => !result.valid);
    
    if (hasInvalidData) {
      toast({
        title: "Dados inválidos",
        description: "Corrija os erros antes de prosseguir com a importação.",
        variant: "destructive"
      });
      return;
    }

    importMutation.mutate(parsedData);
  };

  // Handle close with cleanup
  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidationResults([]);
    setActiveTab("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  // Conclude import
  const handleFinish = () => {
    handleClose();
    onSuccess();
  };

  // Utility functions
  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const isValidCPF = (cpf: string) => {
    // Simplificado para verificação básica de formato
    return /^\d{11}$/.test(cpf.replace(/[^\d]/g, ''));
  };

  const isValidDate = (date: string) => {
    // Aceitar formato YYYY-MM-DD
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Pacientes</DialogTitle>
          <DialogDescription>
            Importe pacientes através de um arquivo CSV.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="upload" disabled={importMutation.isPending}>Upload</TabsTrigger>
            <TabsTrigger value="review" disabled={parsedData.length === 0 || importMutation.isPending}>Revisão</TabsTrigger>
            <TabsTrigger value="results" disabled={!importMutation.isSuccess}>Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="p-4 border rounded-lg">
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="file-upload">Selecione um arquivo CSV</Label>
                <Input 
                  id="file-upload" 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  disabled={processing}
                  className="mt-1"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p>O arquivo deve conter as seguintes colunas (obrigatórias marcadas com *):</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>nome* - Nome completo do paciente</li>
                  <li>email* - E-mail do paciente</li>
                  <li>telefone - Telefone</li>
                  <li>cpf - CPF</li>
                  <li>dataNascimento - Data de nascimento (AAAA-MM-DD)</li>
                  <li>genero - Gênero</li>
                  <li>endereco - Endereço completo</li>
                  <li>cidade - Cidade</li>
                  <li>estado - Estado (UF)</li>
                  <li>cep - CEP</li>
                  <li>observacoes - Observações gerais</li>
                  <li>planoSaudeNome - Nome do plano de saúde</li>
                  <li>numeroCarteirinha - Número da carteirinha (obrigatório se houver plano)</li>
                  <li>dataValidade - Data de validade do plano (AAAA-MM-DD, obrigatório se houver plano)</li>
                </ul>
              </div>

              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Baixar modelo CSV
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="review" className="p-4 border rounded-lg">
            {processing ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Processando arquivo...</span>
              </div>
            ) : parsedData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {parsedData.length} {parsedData.length === 1 ? 'registro' : 'registros'} encontrados
                  </h3>
                  
                  <Badge variant={validationResults.some(r => !r.valid) ? "destructive" : "default"}>
                    {validationResults.filter(r => !r.valid).length} com erros
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, index) => (
                        <TableRow key={index} className={!validationResults[index]?.valid ? "bg-red-50" : undefined}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.nome || "-"}</TableCell>
                          <TableCell>{row.email || "-"}</TableCell>
                          <TableCell>{row.telefone || "-"}</TableCell>
                          <TableCell>{row.planoSaudeNome || "Particular"}</TableCell>
                          <TableCell>
                            {validationResults[index]?.valid ? (
                              <Badge variant="default" className="bg-green-500 text-white">Válido</Badge>
                            ) : (
                              <Badge variant="destructive">Com erros</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {validationResults.some(r => !r.valid) && (
                  <Alert variant="destructive" className="mt-4">
                    <FileWarning className="h-4 w-4" />
                    <AlertTitle>Erros de validação detectados</AlertTitle>
                    <AlertDescription>
                      <p>Os seguintes erros foram encontrados:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {validationResults.map((result, index) => 
                          !result.valid && result.errors.map((error, errorIndex) => (
                            <li key={`${index}-${errorIndex}`}>
                              Linha {index + 1}: {error}
                            </li>
                          ))
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado para revisar. Faça upload de um arquivo CSV válido.
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="p-4 border rounded-lg">
            <div className="flex flex-col gap-6 items-center justify-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-center">Importação Concluída</h3>
              
              <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-md">
                <div className="p-4 rounded-lg bg-neutral-100 text-center">
                  <div className="text-2xl font-bold">{importStats.total}</div>
                  <div className="text-sm text-neutral-600">Total</div>
                </div>
                <div className="p-4 rounded-lg bg-green-100 text-center">
                  <div className="text-2xl font-bold">{importStats.successful}</div>
                  <div className="text-sm text-green-600">Sucesso</div>
                </div>
                <div className="p-4 rounded-lg bg-red-100 text-center">
                  <div className="text-2xl font-bold">{importStats.failed}</div>
                  <div className="text-sm text-red-600">Falhas</div>
                </div>
              </div>
              
              {importStats.failed > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Alguns registros não foram importados</AlertTitle>
                  <AlertDescription>
                    Verifique os erros, corrija o arquivo e tente importar novamente os registros pendentes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex space-x-2 justify-end">
          {activeTab === "upload" && (
            <>
              <DialogClose asChild>
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              </DialogClose>
              <Button 
                disabled={!file || processing}
                onClick={() => setActiveTab("review")}
              >
                Próximo
              </Button>
            </>
          )}

          {activeTab === "review" && (
            <>
              <Button variant="outline" onClick={() => setActiveTab("upload")}>Voltar</Button>
              <Button 
                disabled={parsedData.length === 0 || importMutation.isPending || validationResults.some(r => !r.valid)}
                onClick={handleImport}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar {parsedData.length} pacientes
                  </>
                )}
              </Button>
            </>
          )}

          {activeTab === "results" && (
            <Button onClick={handleFinish}>Concluir</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}