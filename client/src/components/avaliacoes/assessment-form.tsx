
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
  options: { value: number; label: string }[];
}

interface AssessmentFormProps {
  title: string;
  questions: Question[];
  onComplete: (score: number) => void;
}

export default function AssessmentForm({ title, questions, onComplete }: AssessmentFormProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/avaliacoes", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Avaliação concluída",
        description: "Suas respostas foram salvas com sucesso.",
      });
      onComplete(calculateScore());
    },
  });

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateScore = () => {
    return Object.values(answers).reduce((sum, value) => sum + value, 0);
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length !== questions.length) {
      toast({
        title: "Erro",
        description: "Por favor, responda todas as questões.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      respostas: answers,
      pontuacao: calculateScore(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <Label>{question.text}</Label>
            <RadioGroup
              onValueChange={(value) => handleAnswer(question.id, parseInt(value))}
              value={answers[question.id]?.toString()}
            >
              {question.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value.toString()} id={`q${question.id}-${option.value}`} />
                  <Label htmlFor={`q${question.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Concluir Avaliação"}
        </Button>
      </CardFooter>
    </Card>
  );
}
