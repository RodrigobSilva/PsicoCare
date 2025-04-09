import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { WebSocketServer } from "ws";
import { logger } from "./logger";
import OpenAI from "openai";

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
import * as fs from 'fs';
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
import { whatsappService } from './services/whatsapp';

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
  // Rotas de gerenciamento de usuários
  app.get("/api/usuarios", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      // Se houver query param tipo, filtramos por tipo
      const tipo = req.query.tipo as string;
      
      let usuarios;
      if (tipo) {
        usuarios = await storage.getUsersByTipo(tipo);
      } else {
        // Buscar todos os usuários
        usuarios = await storage.getAllUsers();
      }
      
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar usuários", erro: error });
    }
  });
  
  app.get("/api/usuarios/:id", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const usuario = await storage.getUser(id);
      
      if (!usuario) {
        return res.status(404).json({ mensagem: "Usuário não encontrado" });
      }
      
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar usuário", erro: error });
    }
  });
  
  app.post("/api/usuarios", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      // Verificar se já existe um usuário com o mesmo email
      const existeEmail = await storage.getUserByEmail(req.body.email);
      if (existeEmail) {
        return res.status(400).json({ mensagem: "Já existe um usuário com este email" });
      }
      
      // Criar o usuário
      const novoUsuario = await storage.createUser(req.body);
      
      // Não retornamos a senha na resposta
      const { senha, ...usuarioSemSenha } = novoUsuario;
      
      res.status(201).json(usuarioSemSenha);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao criar usuário", erro: error });
    }
  });
  
  app.patch("/api/usuarios/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o usuário existe
      const usuario = await storage.getUser(id);
      if (!usuario) {
        return res.status(404).json({ mensagem: "Usuário não encontrado" });
      }
      
      // Verificar se o email está sendo alterado e se já existe
      if (req.body.email && req.body.email !== usuario.email) {
        const existeEmail = await storage.getUserByEmail(req.body.email);
        if (existeEmail && existeEmail.id !== id) {
          return res.status(400).json({ mensagem: "Já existe um usuário com este email" });
        }
      }
      
      // Atualizar o usuário
      const usuarioAtualizado = await storage.updateUser(id, req.body);
      
      if (!usuarioAtualizado) {
        return res.status(404).json({ mensagem: "Usuário não encontrado" });
      }
      
      // Não retornamos a senha na resposta
      const { senha, ...usuarioSemSenha } = usuarioAtualizado;
      
      res.json(usuarioSemSenha);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao atualizar usuário", erro: error });
    }
  });
  
  app.delete("/api/usuarios/:id", verificarAutenticacao, verificarNivelAcesso(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o usuário existe
      const usuario = await storage.getUser(id);
      if (!usuario) {
        return res.status(404).json({ mensagem: "Usuário não encontrado" });
      }
      
      // Verificar se é o próprio usuário tentando se excluir
      if (req.user?.id === id) {
        return res.status(400).json({ mensagem: "Você não pode excluir sua própria conta" });
      }
      
      // Excluir o usuário
      await storage.deleteUser(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir usuário", erro: error });
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

      // Deletar disponibilidades do psicólogo
      const disponibilidades = await storage.getDisponibilidadesByPsicologo(id);
      for (const disp of disponibilidades) {
        await storage.deleteDisponibilidade(disp.id);
      }

      // Deletar atendimentos do psicólogo
      const atendimentos = await storage.getAtendimentosByPsicologo(id);
      for (const atend of atendimentos) {
        await storage.deleteAtendimento(atend.id);
      }

      // Deletar agendamentos do psicólogo
      const agendamentos = await storage.getAgendamentosByPsicologo(id);
      for (const agend of agendamentos) {
        await storage.deleteAgendamento(agend.id);
      }

      // Finalmente deletar o psicólogo e seu usuário
      await storage.deletePsicologo(id);
      await storage.deleteUser(psicologo.usuarioId);

      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir psicólogo:", error);
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
      const { filialId } = req.query;
      let salas = await storage.getAllSalas();
      
      // Filtrar por filial se o parâmetro for fornecido
      if (filialId) {
        salas = salas.filter(sala => sala.filialId === parseInt(filialId as string));
      }
      
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

      const validatedData = insertSalaSchema.parse({
        ...req.body,
        id: id
      });

      const salaAtualizada = await storage.updateSala(id, validatedData);

      res.json(salaAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar sala:", error);
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

      // Verificar se existem pacientes usando este plano
      const pacientesComPlano = await storage.getPacientesPlanoSaudeByPlano(id);
      if (pacientesComPlano && pacientesComPlano.length > 0) {
        return res.status(400).json({ 
          mensagem: "Não é possível excluir o plano pois existem pacientes vinculados a ele" 
        });
      }

      await storage.deletePlanoSaude(id);

      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
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

  // Enviar notificação via WhatsApp
  app.post("/api/notificacoes/whatsapp", verificarAutenticacao, async (req, res) => {
    try {
      const { telefone, mensagem } = req.body;
      await whatsappService.sendMessage(telefone, mensagem);
      res.json({ mensagem: "Notificação enviada com sucesso" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao enviar notificação", erro: error });
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

  // Avaliações clínicas
  app.get("/api/avaliacoes", verificarAutenticacao, async (req, res) => {
    try {
      const pacienteId = parseInt(req.query.pacienteId as string);
      const avaliacoes = await storage.getAvaliacoesByPaciente(pacienteId);
      res.json(avaliacoes);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar avaliações", erro: error });
    }
  });

  app.post("/api/avaliacoes", verificarAutenticacao, async (req, res) => {
    try {
      const novaAvaliacao = await storage.createAvaliacao(req.body);
      res.status(201).json(novaAvaliacao);
    } catch (error) {
      res.status(400).json({ mensagem: "Erro ao criar avaliação", erro: error });
    }
  });

  // Rotas para Teleconsulta
  app.get("/api/agendamentos/:id", verificarAutenticacao, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agendamento = await storage.getAgendamento(id);
      
      if (!agendamento) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }

      // Enriquecendo o agendamento com dados do paciente e psicólogo
      const paciente = await storage.getPaciente(agendamento.pacienteId);
      const psicologo = await storage.getPsicologo(agendamento.psicologoId);
      
      if (paciente) {
        const usuarioPaciente = await storage.getUser(paciente.usuarioId);
        paciente.usuario = usuarioPaciente;
      }
      
      if (psicologo) {
        const usuarioPsicologo = await storage.getUser(psicologo.usuarioId);
        psicologo.usuario = usuarioPsicologo;
      }
      
      const agendamentoCompleto = {
        ...agendamento,
        paciente,
        psicologo
      };
      
      res.json(agendamentoCompleto);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar detalhes do agendamento", erro: error });
    }
  });
  
  app.post("/api/teleconsultas/iniciar", verificarAutenticacao, async (req, res) => {
    try {
      const { agendamentoId, iniciadoPor, dataHoraInicio } = req.body;
      
      // Verificar se o agendamento existe
      const agendamento = await storage.getAgendamento(parseInt(agendamentoId));
      if (!agendamento) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }
      
      // Verificar se o usuário tem permissão para iniciar essa teleconsulta
      const usuarioEhPsicologo = req.user.tipo === "psicologo";
      const usuarioEhPaciente = req.user.tipo === "paciente";
      const usuarioEhAdmin = req.user.tipo === "admin";
      
      if (!usuarioEhPsicologo && !usuarioEhPaciente && !usuarioEhAdmin) {
        return res.status(403).json({ mensagem: "Sem permissão para iniciar esta teleconsulta" });
      }
      
      // Em uma implementação real, aqui seria criado um registro de teleconsulta
      // e potencialmente integraria com um serviço de videoconferência
      
      res.status(200).json({
        mensagem: "Teleconsulta iniciada com sucesso",
        agendamentoId,
        dataHoraInicio,
        iniciadoPor
      });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao iniciar teleconsulta", erro: error });
    }
  });
  
  // Endpoint para transcrição de áudio da consulta
  const upload = multer({ 
    dest: 'uploads/teleconsultas/', 
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
  });
  
  app.post('/api/teleconsultas/transcrever', verificarAutenticacao, upload.single('arquivo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ mensagem: "Nenhum arquivo enviado" });
      }
      
      // Verificar se OPENAI_API_KEY está configurada
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ mensagem: "API key da OpenAI não configurada" });
      }
      
      const filePath = req.file.path;
      
      // Transcrever áudio usando OpenAI Whisper
      const transcricao = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
        language: "pt"
      });
      
      // Remover arquivo temporário após processamento
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erro ao remover arquivo temporário: ${filePath}`, err);
        }
      });
      
      res.json({
        texto: transcricao.text,
        duracao: req.file.size / 10000 // Estimativa aproximada da duração em segundos
      });
      
    } catch (error) {
      console.error("Erro na transcrição de áudio:", error);
      res.status(500).json({ mensagem: "Erro ao processar transcrição", erro: error });
    }
  });
  
  // Endpoint para gerar resumo da consulta
  app.post('/api/resumo-consulta', verificarAutenticacao, async (req, res) => {
    try {
      const { transcricoes } = req.body;
      
      if (!transcricoes || !Array.isArray(transcricoes) || transcricoes.length === 0) {
        return res.status(400).json({ mensagem: "Nenhuma transcrição fornecida" });
      }
      
      // Verificar se OPENAI_API_KEY está configurada
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ mensagem: "API key da OpenAI não configurada" });
      }
      
      // Preparar texto para envio à API
      const textoCompleto = transcricoes.map((t: any) => t.texto).join("\n\n");
      
      // Usar modelo GPT-4 para gerar resumo
      const prompt = `
        Você é um assistente especializado em psicologia clínica. 
        Analise a transcrição a seguir de uma consulta psicológica e crie um resumo bem estruturado
        para o prontuário do paciente. O resumo deve incluir:
        
        1. Principais temas e questões abordadas
        2. Estado emocional do paciente
        3. Progresso em relação a consultas anteriores (se mencionado)
        4. Observações clínicas relevantes
        5. Pontos para acompanhamento em próximas sessões
        
        Use linguagem técnica apropriada para um prontuário psicológico, mas mantenha clareza e objetividade.
        Preserve a confidencialidade, usando apenas informações presentes na transcrição.
        
        Transcrição da consulta:
        ${textoCompleto}
      `;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Use o modelo mais recente disponível
        messages: [
          { role: "system", content: "Você é um assistente especializado em psicologia clínica, auxiliando na elaboração de prontuários." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      });
      
      // Enviar resposta
      res.json({
        resumo: completion.choices[0].message.content
      });
      
    } catch (error) {
      console.error("Erro ao gerar resumo da consulta:", error);
      res.status(500).json({ mensagem: "Erro ao gerar resumo", erro: error });
    }
  });
  
  app.post("/api/teleconsultas/:sessionId/encerrar", verificarAutenticacao, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { encerradoPor, dataHoraFim } = req.body;
      
      // Verificar se o agendamento existe
      const agendamento = await storage.getAgendamento(parseInt(sessionId));
      if (!agendamento) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }
      
      // Em uma implementação real, aqui seria atualizado o registro de teleconsulta
      // e potencialmente integraria com um serviço de videoconferência para encerrar a sessão
      
      // Atualizar o status do agendamento para "realizado"
      await storage.updateAgendamento(parseInt(sessionId), {
        status: "realizado"
      });
      
      // Registrar um atendimento
      await storage.createAtendimento({
        pacienteId: agendamento.pacienteId,
        psicologoId: agendamento.psicologoId,
        data: new Date().toISOString().split('T')[0],
        horaInicio: agendamento.horaInicio,
        horaFim: agendamento.horaFim,
        tipo: "teleconsulta",
        observacoes: "Teleconsulta realizada",
        valorCobrado: agendamento.valorConsulta || 0,
        valorPago: 0, // Será atualizado quando o pagamento for processado
        status: "realizado"
      });
      
      res.status(200).json({
        mensagem: "Teleconsulta encerrada com sucesso",
        agendamentoId: sessionId,
        dataHoraFim,
        encerradoPor
      });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao encerrar teleconsulta", erro: error });
    }
  });

  // Configuração para pastas de upload
  // Verifica se a pasta uploads/teleconsultas existe, se não, cria
  if (!fs.existsSync('./uploads/teleconsultas')){
    fs.mkdirSync('./uploads/teleconsultas', { recursive: true });
  }
  
  // Inicializar o servidor HTTP
  const httpServer = createServer(app);
  return httpServer;
}