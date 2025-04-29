import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "../ui/label";

const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

interface Disponibilidade {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  recorrente: boolean;
  intervalo: number;
  duracaoConsulta: number;
}

interface DisponibilidadeHorariosProps {
  value: Disponibilidade[];
  onChange: (value: Disponibilidade[]) => void;
}

export default function DisponibilidadeHorarios({ value, onChange }: DisponibilidadeHorariosProps) {
  const addDisponibilidade = () => {
    onChange([
      ...value,
      {
        diaSemana: 1,
        horaInicio: "08:00",
        horaFim: "17:00",
        recorrente: true,
        intervalo: 10,
        duracaoConsulta: 50,
      },
    ]);
  };

  const removeDisponibilidade = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateDisponibilidade = (index: number, field: keyof Disponibilidade, newValue: any) => {
    const updatedValue = [...value];
    updatedValue[index] = {
      ...updatedValue[index],
      [field]: newValue,
    };

    // Validação de horários
    if (field === "horaInicio" || field === "horaFim") {
      const inicio = field === "horaInicio" ? newValue : updatedValue[index].horaInicio;
      const fim = field === "horaFim" ? newValue : updatedValue[index].horaFim;

      if (inicio >= fim) {
        return; // Não permite que o horário de início seja maior que o de fim
      }

      // Verifica sobreposição com outros horários
      const hasOverlap = value.some((disp, i) => {
        if (i === index) return false;
        if (disp.diaSemana !== updatedValue[index].diaSemana) return false;

        return (
          (inicio >= disp.horaInicio && inicio < disp.horaFim) ||
          (fim > disp.horaInicio && fim <= disp.horaFim)
        );
      });

      if (hasOverlap) {
        return; // Não permite sobreposição de horários
      }
    }

    onChange(updatedValue);
  };

  return (
    <div className="space-y-4">
      {value.map((disponibilidade, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Dia da Semana</Label>
                <Select
                  value={disponibilidade.diaSemana.toString()}
                  onValueChange={(newValue) =>
                    updateDisponibilidade(index, "diaSemana", parseInt(newValue))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value.toString()}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Hora Início</Label>
                <Input
                  type="time"
                  value={disponibilidade.horaInicio}
                  onChange={(e) =>
                    updateDisponibilidade(index, "horaInicio", e.target.value)
                  }
                />
              </div>

              <div>
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={disponibilidade.horaFim}
                  onChange={(e) =>
                    updateDisponibilidade(index, "horaFim", e.target.value)
                  }
                />
              </div>

              <div>
                <Label>Duração da Consulta (min)</Label>
                <Input
                  type="number"
                  min={30}
                  max={120}
                  value={disponibilidade.duracaoConsulta}
                  onChange={(e) =>
                    updateDisponibilidade(index, "duracaoConsulta", parseInt(e.target.value))
                  }
                />
              </div>

              <div>
                <Label>Intervalo (min)</Label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={disponibilidade.intervalo}
                  onChange={(e) =>
                    updateDisponibilidade(index, "intervalo", parseInt(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  checked={disponibilidade.recorrente}
                  onCheckedChange={(checked) =>
                    updateDisponibilidade(index, "recorrente", checked)
                  }
                />
                <Label>Recorrente</Label>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-4"
              onClick={() => removeDisponibilidade(index)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button type="button" onClick={addDisponibilidade} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Horário
      </Button>
    </div>
  );
}