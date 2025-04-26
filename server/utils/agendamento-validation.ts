import { DisponibilidadePsicologo, BloqueioHorario, Agendamento } from "@shared/schema";
import { format, parse, isWithinInterval, getDay, isAfter, isBefore, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

// Configurações de horário da clínica
export const HORARIO_CLINICA = {
  // Segunda a Sexta (1-5)
  SEMANA: {
    abertura: "08:00",
    fechamento: "21:00",
    ultimoAgendamento: "20:30" // Para sessões de 30 minutos
  },
  // Sábado (6)
  SABADO: {
    abertura: "08:00",
    fechamento: "15:00",
    ultimoAgendamento: "14:30" // Para sessões de 30 minutos
  },
  // Domingo (0) - Clínica fechada
  DOMINGO: {
    abertura: null,
    fechamento: null,
    ultimoAgendamento: null
  }
};

// Interface para o resultado da validação
export interface ValidacaoAgendamento {
  valido: boolean;
  mensagem: string;
}

// Função para validar se o horário está dentro do funcionamento da clínica
export function validarHorarioClinica(
  data: Date,
  horaInicio: string,
  horaFim: string
): ValidacaoAgendamento {
  // Obter o dia da semana (0-6, onde 0 é domingo)
  const diaSemana = getDay(data);
  
  // Verificar se a clínica está aberta nesse dia
  if (diaSemana === 0) { // Domingo
    return {
      valido: false,
      mensagem: "A clínica não funciona aos domingos."
    };
  }

  // Determinar os horários da clínica com base no dia da semana
  const horarios = diaSemana === 6 ? HORARIO_CLINICA.SABADO : HORARIO_CLINICA.SEMANA;
  
  // Converter as horas para objetos Date para comparação
  const dataBase = new Date(data);
  dataBase.setHours(0, 0, 0, 0); // Zerar hora, minuto, segundo e milissegundo
  
  // Horário de abertura da clínica
  const [horaAbertura, minutoAbertura] = horarios.abertura.split(":").map(Number);
  const horarioAbertura = new Date(dataBase);
  horarioAbertura.setHours(horaAbertura, minutoAbertura, 0, 0);
  
  // Horário de fechamento da clínica
  const [horaFechamento, minutoFechamento] = horarios.fechamento.split(":").map(Number);
  const horarioFechamento = new Date(dataBase);
  horarioFechamento.setHours(horaFechamento, minutoFechamento, 0, 0);
  
  // Último horário permitido para agendamento
  const [horaUltimo, minutoUltimo] = horarios.ultimoAgendamento.split(":").map(Number);
  const ultimoHorario = new Date(dataBase);
  ultimoHorario.setHours(horaUltimo, minutoUltimo, 0, 0);
  
  // Hora de início do agendamento
  const [horaInicioH, horaInicioM] = horaInicio.split(":").map(Number);
  const horarioInicio = new Date(dataBase);
  horarioInicio.setHours(horaInicioH, horaInicioM, 0, 0);
  
  // Hora de fim do agendamento
  const [horaFimH, horaFimM] = horaFim.split(":").map(Number);
  const horarioFim = new Date(dataBase);
  horarioFim.setHours(horaFimH, horaFimM, 0, 0);
  
  // Verificar se o horário de início está dentro do horário de funcionamento
  if (isBefore(horarioInicio, horarioAbertura)) {
    return {
      valido: false,
      mensagem: `O horário de início deve ser após o horário de abertura da clínica (${horarios.abertura}).`
    };
  }
  
  // Verificar se o horário de início não é após o último horário permitido
  if (isAfter(horarioInicio, ultimoHorario)) {
    return {
      valido: false,
      mensagem: `O último horário permitido para agendamento é ${horarios.ultimoAgendamento}.`
    };
  }
  
  // Verificar se o horário de término está dentro do horário de funcionamento
  if (isAfter(horarioFim, horarioFechamento)) {
    return {
      valido: false,
      mensagem: `O horário de término deve ser antes do horário de fechamento da clínica (${horarios.fechamento}).`
    };
  }
  
  return {
    valido: true,
    mensagem: "Horário dentro do funcionamento da clínica."
  };
}

// Função para validar disponibilidade do psicólogo
export function validarDisponibilidadePsicologo(
  data: Date,
  horaInicio: string,
  horaFim: string,
  disponibilidades: DisponibilidadePsicologo[],
  bloqueios: BloqueioHorario[] = [],
  agendamentosExistentes: Agendamento[] = [],
  agendamentoId?: number // Para ignorar o próprio agendamento ao editar
): ValidacaoAgendamento {
  // Obter o dia da semana (0-6, onde 0 é domingo)
  const diaSemana = getDay(data);
  
  // Verificar se há alguma disponibilidade cadastrada para o dia da semana
  const disponibilidadeDia = disponibilidades.filter(d => 
    d.diaSemana === diaSemana && d.ativo
  );
  
  if (disponibilidadeDia.length === 0) {
    return {
      valido: false,
      mensagem: `O psicólogo não atende neste dia da semana (${formatarDiaSemana(diaSemana)}).`
    };
  }
  
  // Converter as horas para objetos Date para comparação
  const dataBase = new Date(data);
  dataBase.setHours(0, 0, 0, 0);
  
  // Hora de início e fim do agendamento
  const [horaInicioH, horaInicioM] = horaInicio.split(":").map(Number);
  const horarioInicio = new Date(dataBase);
  horarioInicio.setHours(horaInicioH, horaInicioM, 0, 0);
  
  const [horaFimH, horaFimM] = horaFim.split(":").map(Number);
  const horarioFim = new Date(dataBase);
  horarioFim.setHours(horaFimH, horaFimM, 0, 0);
  
  // Verificar se o horário está dentro de alguma disponibilidade do psicólogo
  let dentroDeAlgumaDisponibilidade = false;
  
  for (const disponibilidade of disponibilidadeDia) {
    // Horário de início da disponibilidade
    const [horaDispInicio, minDispInicio] = disponibilidade.horaInicio.split(":").map(Number);
    const dispInicio = new Date(dataBase);
    dispInicio.setHours(horaDispInicio, minDispInicio, 0, 0);
    
    // Horário de fim da disponibilidade
    const [horaDispFim, minDispFim] = disponibilidade.horaFim.split(":").map(Number);
    const dispFim = new Date(dataBase);
    dispFim.setHours(horaDispFim, minDispFim, 0, 0);
    
    // Verificar se o agendamento está contido na disponibilidade
    if (
      !isBefore(horarioInicio, dispInicio) && 
      !isAfter(horarioFim, dispFim)
    ) {
      dentroDeAlgumaDisponibilidade = true;
      break;
    }
  }
  
  if (!dentroDeAlgumaDisponibilidade) {
    return {
      valido: false,
      mensagem: "O horário escolhido está fora da disponibilidade do psicólogo."
    };
  }
  
  // Verificar se há algum bloqueio no período
  const dataFormatada = format(data, "yyyy-MM-dd");
  
  for (const bloqueio of bloqueios) {
    // Verificar se a data do agendamento está dentro do período de bloqueio
    const dataInicioBloqueio = new Date(bloqueio.dataInicio);
    const dataFimBloqueio = new Date(bloqueio.dataFim);
    
    if (
      isWithinInterval(data, { 
        start: dataInicioBloqueio, 
        end: dataFimBloqueio 
      }) && 
      bloqueio.aprovado
    ) {
      return {
        valido: false,
        mensagem: `O psicólogo está indisponível na data selecionada devido a ${bloqueio.motivo || "um bloqueio de agenda"}.`
      };
    }
  }
  
  // Verificar conflito com outros agendamentos
  const agendamentosNoDia = agendamentosExistentes.filter(ag => {
    // Ignorar o próprio agendamento ao editar
    if (agendamentoId && ag.id === agendamentoId) {
      return false;
    }
    
    // Filtrar apenas agendamentos ativos (não cancelados)
    if (ag.status === "cancelado") {
      return false;
    }
    
    // Verificar se é do mesmo dia
    return ag.data === dataFormatada;
  });
  
  for (const agendamento of agendamentosNoDia) {
    // Horário de início do agendamento existente
    const [horaAgInicio, minAgInicio] = agendamento.horaInicio.split(":").map(Number);
    const agInicio = new Date(dataBase);
    agInicio.setHours(horaAgInicio, minAgInicio, 0, 0);
    
    // Horário de fim do agendamento existente
    const [horaAgFim, minAgFim] = agendamento.horaFim.split(":").map(Number);
    const agFim = new Date(dataBase);
    agFim.setHours(horaAgFim, minAgFim, 0, 0);
    
    // Verificar se há sobreposição de horários
    // Sobrepõe se o início do novo está antes do fim do existente E
    // o fim do novo está depois do início do existente
    if (
      (isBefore(horarioInicio, agFim) || horarioInicio.getTime() === agFim.getTime()) && 
      (isAfter(horarioFim, agInicio) || horarioFim.getTime() === agInicio.getTime())
    ) {
      return {
        valido: false,
        mensagem: `Existe um agendamento conflitante no horário das ${format(agInicio, "HH:mm")} às ${format(agFim, "HH:mm")}.`
      };
    }
  }
  
  return {
    valido: true,
    mensagem: "Horário disponível para agendamento."
  };
}

// Função para formatar o dia da semana
export function formatarDiaSemana(diaSemana: number): string {
  const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return diasSemana[diaSemana];
}

// Função principal que combina todas as validações
export async function validarAgendamento(
  data: Date,
  horaInicio: string,
  horaFim: string,
  psicologoId: number,
  disponibilidades: DisponibilidadePsicologo[],
  bloqueios: BloqueioHorario[] = [],
  agendamentosExistentes: Agendamento[] = [],
  agendamentoId?: number
): Promise<ValidacaoAgendamento> {
  // 1. Validar horário da clínica
  const validacaoClinica = validarHorarioClinica(data, horaInicio, horaFim);
  if (!validacaoClinica.valido) {
    return validacaoClinica;
  }
  
  // 2. Validar disponibilidade do psicólogo
  const validacaoPsicologo = validarDisponibilidadePsicologo(
    data,
    horaInicio,
    horaFim,
    disponibilidades,
    bloqueios,
    agendamentosExistentes,
    agendamentoId
  );
  
  return validacaoPsicologo;
}