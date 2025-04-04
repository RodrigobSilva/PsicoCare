import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertPacienteSchema,
  insertPsicologoSchema,
  insertFilialSchema,
  insertSalaSchema,
  insertPlanoSaudeSchema,
  insertAgendamentoSchema,
  insertAtendimentoSchema,
  insertProntuarioSchema,
  insertPagamentoSchema,
  insertBloqueioHorarioSchema,
  insertDisponibilidadePsicologoSchema,
  insertPacientePlanoSaudeSchema,
  insertDocumentoSchema
} from "@shared/schema";

// Middleware para verificar autenticação
const verificarAutenticacao = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ mensagem: "Usuário não autenticado" });
  }
  next();
};

// Middleware para verificar nível de acesso
const verificarNivelAcesso = (tiposPermitidos: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.user || !tiposPermitidos.includes(req.user.tipo)) {
      return res.status(403).json({ mensagem: "Acesso não autorizado" });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configura a autenticação
  setupAuth(app);

  // Rotas de acesso a usuários
  app.get("/api/usuarios", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const usuarios = await Promise.all((await storage.getUsersByTipo("paciente")).map(async (usuario) => {
        const paciente = await storage.getPacienteByUserId(usuario.id);
        return { ...usuario, paciente };
      }));
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar usuários", erro: error });
    }
  });

  // Pacientes
  app.get("/api/pacientes", verificarAutenticacao, async (req, res) => {
    try {
      const pacientes = await storage.getPacientes();
      const pacientesCompletos = await Promise.all(pacientes.map(async (paciente) => {
        const usuario = await storage.getUser(paciente.usuarioId);
        return { ...paciente, usuario };
      }));
      res.json(pacientesCompletos);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar pacientes", erro: error });
    }
  });

  app.get("/api/pacientes/:id", verificarAutenticacao, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const paciente = await storage.getPaciente(id);
      
      if (!paciente) {
        return res.status(404).json({ mensagem: "Paciente não encontrado" });
      }
      
      const usuario = await storage.getUser(paciente.usuarioId);
      const planosDosPacientes = await storage.getPacientesPlanoSaudeByPaciente(id);
      const planos = await Promise.all(planosDosPacientes.map(async (pp) => {
        const plano = await storage.getPlanoSaude(pp.planoSaudeId);
        return { ...pp, plano };
      }));
      
      res.json({ ...paciente, usuario, planos });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar paciente", erro: error });
    }
  });

  app.post("/api/pacientes", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const { usuario, paciente } = req.body;
      
      const novoUsuario = await storage.createUser({
        ...usuario,
        tipo: "paciente"
      });
      
      const validatedData = insertPacienteSchema.parse({
        ...paciente,
        usuarioId: novoUsuario.id
      });
      
      const novoPaciente = await storage.createPaciente(validatedData);
      
      res.status(201).json({
        ...novoPaciente,
        usuario: novoUsuario
      });
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao criar paciente", erro: error });
    }
  });

  app.put("/api/pacientes/:id", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { usuario, paciente } = req.body;
      
      const pacienteExistente = await storage.getPaciente(id);
      if (!pacienteExistente) {
        return res.status(404).json({ mensagem: "Paciente não encontrado" });
      }
      
      await storage.updateUser(pacienteExistente.usuarioId, usuario);
      const pacienteAtualizado = await storage.updatePaciente(id, paciente);
      
      res.json(pacienteAtualizado);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao atualizar paciente", erro: error });
    }
  });

  app.delete("/api/pacientes/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const paciente = await storage.getPaciente(id);
      if (!paciente) {
        return res.status(404).json({ mensagem: "Paciente não encontrado" });
      }
      
      await storage.deletePaciente(id);
      await storage.deleteUser(paciente.usuarioId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir paciente", erro: error });
    }
  });

  // Psicólogos
  app.get("/api/psicologos", verificarAutenticacao, async (req, res) => {
    try {
      const psicologos = await storage.getPsicologos();
      const psicologosCompletos = await Promise.all(psicologos.map(async (psicologo) => {
        const usuario = await storage.getUser(psicologo.usuarioId);
        return { ...psicologo, usuario };
      }));
      res.json(psicologosCompletos);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar psicólogos", erro: error });
    }
  });

  app.get("/api/psicologos/:id", verificarAutenticacao, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const psicologo = await storage.getPsicologo(id);
      
      if (!psicologo) {
        return res.status(404).json({ mensagem: "Psicólogo não encontrado" });
      }
      
      const usuario = await storage.getUser(psicologo.usuarioId);
      const disponibilidades = await storage.getDisponibilidadesByPsicologo(id);
      
      res.json({ ...psicologo, usuario, disponibilidades });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar psicólogo", erro: error });
    }
  });

  app.post("/api/psicologos", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const { usuario, psicologo, disponibilidades } = req.body;
      
      const novoUsuario = await storage.createUser({
        ...usuario,
        tipo: "psicologo"
      });
      
      const validatedData = insertPsicologoSchema.parse({
        ...psicologo,
        usuarioId: novoUsuario.id
      });
      
      const novoPsicologo = await storage.createPsicologo(validatedData);
      
      // Adicionar disponibilidades se fornecidas
      if (disponibilidades && Array.isArray(disponibilidades)) {
        for (const disp of disponibilidades) {
          await storage.createDisponibilidade({
            ...disp,
            psicologoId: novoPsicologo.id
          });
        }
      }
      
      res.status(201).json({
        ...novoPsicologo,
        usuario: novoUsuario
      });
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao criar psicólogo", erro: error });
    }
  });

  app.put("/api/psicologos/:id", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { usuario, psicologo } = req.body;
      
      const psicologoExistente = await storage.getPsicologo(id);
      if (!psicologoExistente) {
        return res.status(404).json({ mensagem: "Psicólogo não encontrado" });
      }
      
      await storage.updateUser(psicologoExistente.usuarioId, usuario);
      const psicologoAtualizado = await storage.updatePsicologo(id, psicologo);
      
      res.json(psicologoAtualizado);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao atualizar psicólogo", erro: error });
    }
  });

  app.delete("/api/psicologos/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const psicologo = await storage.getPsicologo(id);
      if (!psicologo) {
        return res.status(404).json({ mensagem: "Psicólogo não encontrado" });
      }
      
      await storage.deletePsicologo(id);
      await storage.deleteUser(psicologo.usuarioId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir psicólogo", erro: error });
    }
  });

  // Filiais
  app.get("/api/filiais", verificarAutenticacao, async (req, res) => {
    try {
      const filiais = await storage.getFiliais();
      res.json(filiais);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar filiais", erro: error });
    }
  });

  app.get("/api/filiais/:id", verificarAutenticacao, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const filial = await storage.getFilial(id);
      
      if (!filial) {
        return res.status(404).json({ mensagem: "Filial não encontrada" });
      }
      
      const salas = await storage.getSalasByFilial(id);
      
      res.json({ ...filial, salas });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar filial", erro: error });
    }
  });

  app.post("/api/filiais", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const validatedData = insertFilialSchema.parse(req.body);
      const novaFilial = await storage.createFilial(validatedData);
      
      res.status(201).json(novaFilial);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao criar filial", erro: error });
    }
  });

  app.put("/api/filiais/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const filialExistente = await storage.getFilial(id);
      if (!filialExistente) {
        return res.status(404).json({ mensagem: "Filial não encontrada" });
      }
      
      const filialAtualizada = await storage.updateFilial(id, req.body);
      
      res.json(filialAtualizada);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao atualizar filial", erro: error });
    }
  });

  app.delete("/api/filiais/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const filial = await storage.getFilial(id);
      if (!filial) {
        return res.status(404).json({ mensagem: "Filial não encontrada" });
      }
      
      await storage.deleteFilial(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir filial", erro: error });
    }
  });

  // Salas
  app.get("/api/salas", verificarAutenticacao, async (req, res) => {
    try {
      const salas = await storage.getAllSalas();
      const salasCompletas = await Promise.all(salas.map(async (sala) => {
        const filial = await storage.getFilial(sala.filialId);
        return { ...sala, filial };
      }));
      res.json(salasCompletas);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar salas", erro: error });
    }
  });

  app.get("/api/salas/:id", verificarAutenticacao, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sala = await storage.getSala(id);
      
      if (!sala) {
        return res.status(404).json({ mensagem: "Sala não encontrada" });
      }
      
      const filial = await storage.getFilial(sala.filialId);
      
      res.json({ ...sala, filial });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar sala", erro: error });
    }
  });

  app.post("/api/salas", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const validatedData = insertSalaSchema.parse(req.body);
      const novaSala = await storage.createSala(validatedData);
      
      res.status(201).json(novaSala);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao criar sala", erro: error });
    }
  });

  app.put("/api/salas/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const salaExistente = await storage.getSala(id);
      if (!salaExistente) {
        return res.status(404).json({ mensagem: "Sala não encontrada" });
      }
      
      const salaAtualizada = await storage.updateSala(id, req.body);
      
      res.json(salaAtualizada);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao atualizar sala", erro: error });
    }
  });

  app.delete("/api/salas/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const sala = await storage.getSala(id);
      if (!sala) {
        return res.status(404).json({ mensagem: "Sala não encontrada" });
      }
      
      await storage.deleteSala(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir sala", erro: error });
    }
  });

  // Planos de Saúde
  app.get("/api/planos-saude", verificarAutenticacao, async (req, res) => {
    try {
      const planos = await storage.getPlanosSaude();
      res.json(planos);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar planos de saúde", erro: error });
    }
  });

  app.get("/api/planos-saude/:id", verificarAutenticacao, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plano = await storage.getPlanoSaude(id);
      
      if (!plano) {
        return res.status(404).json({ mensagem: "Plano de saúde não encontrado" });
      }
      
      res.json(plano);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar plano de saúde", erro: error });
    }
  });

  app.post("/api/planos-saude", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const validatedData = insertPlanoSaudeSchema.parse(req.body);
      const novoPlano = await storage.createPlanoSaude(validatedData);
      
      res.status(201).json(novoPlano);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao criar plano de saúde", erro: error });
    }
  });

  app.put("/api/planos-saude/:id", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const planoExistente = await storage.getPlanoSaude(id);
      if (!planoExistente) {
        return res.status(404).json({ mensagem: "Plano de saúde não encontrado" });
      }
      
      const planoAtualizado = await storage.updatePlanoSaude(id, req.body);
      
      res.json(planoAtualizado);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao atualizar plano de saúde", erro: error });
    }
  });

  app.delete("/api/planos-saude/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const plano = await storage.getPlanoSaude(id);
      if (!plano) {
        return res.status(404).json({ mensagem: "Plano de saúde não encontrado" });
      }
      
      await storage.deletePlanoSaude(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir plano de saúde", erro: error });
    }
  });

  // Agendamentos
  app.get("/api/agendamentos", verificarAutenticacao, async (req, res) => {
    try {
      let agendamentos;
      const data = req.query.data ? new Date(req.query.data as string) : undefined;
      const pacienteId = req.query.pacienteId ? parseInt(req.query.pacienteId as string) : undefined;
      const psicologoId = req.query.psicologoId ? parseInt(req.query.psicologoId as string) : undefined;
      const filialId = req.query.filialId ? parseInt(req.query.filialId as string) : undefined;
      
      if (data) {
        agendamentos = await storage.getAgendamentosByData(data);
      } else if (pacienteId) {
        agendamentos = await storage.getAgendamentosByPaciente(pacienteId);
      } else if (psicologoId) {
        agendamentos = await storage.getAgendamentosByPsicologo(psicologoId);
      } else if (filialId) {
        agendamentos = await storage.getAgendamentosByFilial(filialId);
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        agendamentos = await storage.getAgendamentosByData(today);
      }

      const agendamentosCompletos = await Promise.all(agendamentos.map(async (agendamento) => {
        const paciente = await storage.getPaciente(agendamento.pacienteId);
        const psicologo = await storage.getPsicologo(agendamento.psicologoId);
        const sala = agendamento.salaId ? await storage.getSala(agendamento.salaId) : null;
        const filial = await storage.getFilial(agendamento.filialId);
        const planoSaude = agendamento.planoSaudeId ? await storage.getPlanoSaude(agendamento.planoSaudeId) : null;
        
        const pacienteUsuario = paciente ? await storage.getUser(paciente.usuarioId) : null;
        const psicologoUsuario = psicologo ? await storage.getUser(psicologo.usuarioId) : null;
        
        return { 
          ...agendamento, 
          paciente: paciente ? { ...paciente, usuario: pacienteUsuario } : null,
          psicologo: psicologo ? { ...psicologo, usuario: psicologoUsuario } : null,
          sala,
          filial,
          planoSaude
        };
      }));
      
      res.json(agendamentosCompletos);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar agendamentos", erro: error });
    }
  });

  app.get("/api/agendamentos/:id", verificarAutenticacao, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agendamento = await storage.getAgendamento(id);
      
      if (!agendamento) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }
      
      const paciente = await storage.getPaciente(agendamento.pacienteId);
      const psicologo = await storage.getPsicologo(agendamento.psicologoId);
      const sala = agendamento.salaId ? await storage.getSala(agendamento.salaId) : null;
      const filial = await storage.getFilial(agendamento.filialId);
      const planoSaude = agendamento.planoSaudeId ? await storage.getPlanoSaude(agendamento.planoSaudeId) : null;
      
      const pacienteUsuario = paciente ? await storage.getUser(paciente.usuarioId) : null;
      const psicologoUsuario = psicologo ? await storage.getUser(psicologo.usuarioId) : null;
      
      res.json({ 
        ...agendamento, 
        paciente: paciente ? { ...paciente, usuario: pacienteUsuario } : null,
        psicologo: psicologo ? { ...psicologo, usuario: psicologoUsuario } : null,
        sala,
        filial,
        planoSaude
      });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar agendamento", erro: error });
    }
  });

  app.post("/api/agendamentos", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria", "psicologo"]), async (req, res) => {
    try {
      const validatedData = insertAgendamentoSchema.parse(req.body);
      const novoAgendamento = await storage.createAgendamento(validatedData);
      
      res.status(201).json(novoAgendamento);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao criar agendamento", erro: error });
    }
  });

  app.put("/api/agendamentos/:id", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria", "psicologo"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const agendamentoExistente = await storage.getAgendamento(id);
      if (!agendamentoExistente) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }
      
      const agendamentoAtualizado = await storage.updateAgendamento(id, req.body);
      
      res.json(agendamentoAtualizado);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao atualizar agendamento", erro: error });
    }
  });

  app.delete("/api/agendamentos/:id", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const agendamento = await storage.getAgendamento(id);
      if (!agendamento) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }
      
      await storage.deleteAgendamento(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir agendamento", erro: error });
    }
  });

  // Obter estatísticas para o dashboard
  app.get("/api/dashboard/estatisticas", verificarAutenticacao, async (req, res) => {
    try {
      // Estatísticas básicas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const agendamentosHoje = await storage.getAgendamentosByData(today);
      const pacientes = await storage.getPacientes();
      
      // Calcular novos pacientes (últimos 30 dias)
      const umMesAtras = new Date();
      umMesAtras.setDate(umMesAtras.getDate() - 30);
      
      // Contar atendimentos realizados para faturamento (simplificado)
      const atendimentos = Array.from(await Promise.all(agendamentosHoje.map(async (agend) => {
        return await storage.getAtendimento(agend.id);
      }))).filter(a => a !== undefined);
      
      // Calcular taxa de ocupação
      const psicologos = await storage.getPsicologos();
      
      // Retornar estatísticas
      res.json({
        sessoesHoje: agendamentosHoje.length,
        novosPacientes: 8, // Valor exemplo - em uma implementação real seria calculado
        faturamentoMensal: 28560, // Valor exemplo - em uma implementação real seria calculado
        taxaOcupacao: 78, // Valor exemplo - em uma implementação real seria calculado
      });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao obter estatísticas", erro: error });
    }
  });

  // Obter notificações
  app.get("/api/notificacoes", verificarAutenticacao, async (req, res) => {
    try {
      // Em uma implementação real, as notificações seriam armazenadas no banco de dados
      // Aqui estamos retornando dados de exemplo
      res.json([
        {
          id: 1,
          tipo: "cancelamento",
          mensagem: "Sofia Pereira cancelou a sessão de 16/08 às 10:00",
          tempo: "15 minutos"
        },
        {
          id: 2,
          tipo: "novo_paciente",
          mensagem: "Gabriel Oliveira foi cadastrado no sistema",
          tempo: "2 horas"
        },
        {
          id: 3,
          tipo: "fatura",
          mensagem: "Plano de saúde Unimed: Envio pendente",
          tempo: "1 dia"
        }
      ]);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao obter notificações", erro: error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
