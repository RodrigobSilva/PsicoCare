import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { WebSocketServer } from "ws";
import { logger } from "./logger";
import OpenAI from "openai";
import { and, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
import * as fs from 'fs';
import crypto from 'crypto';
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
      
      // Hash da senha antes de criar o usuário
      const { hashPassword } = await import('./auth');
      const senhaCriptografada = await hashPassword(req.body.senha);
      
      // Criar o usuário com a senha criptografada
      const novoUsuario = await storage.createUser({
        ...req.body,
        senha: senhaCriptografada
      });
      
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
      
      // Preparar dados para atualização
      const dadosAtualizados = { ...req.body };
      
      // Se a senha estiver sendo alterada, fazer o hash
      if (dadosAtualizados.senha) {
        const { hashPassword } = await import('./auth');
        dadosAtualizados.senha = await hashPassword(dadosAtualizados.senha);
        console.log("Senha criptografada com sucesso");
      }
      
      // Atualizar o usuário
      const usuarioAtualizado = await storage.updateUser(id, dadosAtualizados);
      
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
  
  // Alternar status do paciente (ativo/inativo)
  app.patch("/api/pacientes/:id/status", verificarAutenticacao, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { ativo } = req.body;
      
      // Buscar o paciente para obter o ID do usuário associado
      const paciente = await storage.getPaciente(id);
      if (!paciente) {
        return res.status(404).json({ mensagem: "Paciente não encontrado" });
      }
      
      // Atualizar o status no registro do usuário
      await storage.updateUser(paciente.usuarioId, { ativo });
      
      res.json({ mensagem: "Status atualizado com sucesso" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar status do paciente", erro: error });
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

  app.delete("/api/pacientes/:id", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const paciente = await storage.getPaciente(id);
      if (!paciente) {
        return res.status(404).json({ mensagem: "Paciente não encontrado" });
      }

      // Deletar agendamentos do paciente
      const agendamentos = await storage.getAgendamentosByPaciente(id);
      
      // Primeiro, deleta todos os atendimentos (e pagamentos associados)
      const atendimentos = await storage.getAtendimentosByPaciente(id);
      for (const atendimento of atendimentos) {
        // Primeiro deletar pagamentos associados a cada atendimento
        const pagamentosAtendimento = await storage.getPagamentosByAtendimento(atendimento.id);
        for (const pagamento of pagamentosAtendimento) {
          await storage.deletePagamento(pagamento.id);
        }
        // Depois deleta o atendimento
        await storage.deleteAtendimento(atendimento.id);
      }
      
      // Agora deleta os agendamentos
      for (const agendamento of agendamentos) {
        await storage.deleteAgendamento(agendamento.id);
      }

      // Deletar planos de saúde associados
      const planosDosPacientes = await storage.getPacientesPlanoSaudeByPaciente(id);
      for (const plano of planosDosPacientes) {
        await storage.deletePacientePlanoSaude(plano.id);
      }

      // Deletar documentos do paciente
      const documentos = await storage.getDocumentosByPaciente(id);
      for (const documento of documentos) {
        await storage.deleteDocumento(documento.id);
      }

      // Finalmente deletar o paciente e seu usuário
      await storage.deletePaciente(id);
      await storage.deleteUser(paciente.usuarioId);

      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir paciente:", error);
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

  app.get("/api/psicologos/usuario/:userId", verificarAutenticacao, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const psicologo = await storage.getPsicologoByUserId(userId);

      if (!psicologo) {
        return res.status(404).json({ mensagem: "Psicólogo não encontrado para este usuário" });
      }

      const usuario = await storage.getUser(psicologo.usuarioId);
      const disponibilidades = await storage.getDisponibilidadesByPsicologo(psicologo.id);
      
      res.json({
        ...psicologo,
        usuario,
        disponibilidades
      });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar psicólogo", erro: error });
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
        // Primeiro deletar pagamentos associados a cada atendimento
        const pagamentosAtendimento = await storage.getPagamentosByAtendimento(atend.id);
        for (const pagamento of pagamentosAtendimento) {
          await storage.deletePagamento(pagamento.id);
        }
        // Depois deleta o atendimento
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
  
  // Alternar status do plano de saúde (ativo/inativo)
  app.patch("/api/planos-saude/:id/status", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { ativo } = req.body;
      
      const plano = await storage.getPlanoSaude(id);
      if (!plano) {
        return res.status(404).json({ mensagem: "Plano de saúde não encontrado" });
      }
      
      // Atualizar o status no plano de saúde
      await storage.updatePlanoSaude(id, { ativo });
      
      res.json({ mensagem: "Status atualizado com sucesso" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar status do plano de saúde", erro: error });
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

      // Em vez de excluir, vamos inativar o plano
      await storage.updatePlanoSaude(id, { ativo: false });
      res.status(200).json({ mensagem: "Plano inativado com sucesso" });
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
      const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
      const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
      const pacienteId = req.query.pacienteId ? parseInt(req.query.pacienteId as string) : undefined;
      let psicologoIdParam = req.query.psicologoId ? parseInt(req.query.psicologoId as string) : undefined;
      const filialId = req.query.filialId ? parseInt(req.query.filialId as string) : undefined;

      // Verificar tipo de usuário e aplicar restrições
      if (req.user && req.user.tipo === 'psicologo') {
        // Buscar o psicólogo pelo usuário
        const psicologo = await storage.getPsicologoByUserId(req.user.id);
        if (!psicologo) {
          return res.status(403).json({ mensagem: "Acesso não autorizado" });
        }
        // Forçar filtro pelo ID do psicólogo logado, ignorando qualquer outro psicologoId
        psicologoIdParam = psicologo.id;
      }

      let queryData = new Date();
      if (data) {
        queryData = new Date(data);
      }
      queryData.setHours(0, 0, 0, 0);

      // Buscar por intervalo de datas se dataInicio e dataFim estiverem presentes
      if (dataInicio && dataFim) {
        // Buscar todos os agendamentos e filtrar por data no lado do servidor
        const todosAgendamentos = await storage.getAllAgendamentos();
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        const dataFimStr = dataFim.toISOString().split('T')[0];
        
        agendamentos = todosAgendamentos.filter((ag: any) => {
          const dataAg = typeof ag.data === 'string' ? ag.data : ag.data.toISOString().split('T')[0];
          return dataAg >= dataInicioStr && dataAg <= dataFimStr;
        });
      } else if (dataInicio) {
        // Se só tiver a data de início, retorna todos os agendamentos a partir desta data
        const todosAgendamentos = await storage.getAllAgendamentos();
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        
        console.log(`Filtrando agendamentos a partir de: ${dataInicioStr}`);
        console.log(`Total de agendamentos no banco: ${todosAgendamentos.length}`);
        
        agendamentos = todosAgendamentos.filter((ag: any) => {
          const dataAg = typeof ag.data === 'string' ? ag.data : ag.data.toISOString().split('T')[0];
          const resultado = dataAg >= dataInicioStr;
          console.log(`Agendamento ${ag.id}, data: ${dataAg}, incluído: ${resultado}`);
          return resultado;
        });
      } else {
        // Obter todos os agendamentos
        const todosAgendamentos = await storage.getAllAgendamentos();
        
        // Aplicar os filtros combinados
        agendamentos = todosAgendamentos.filter((ag: any) => {
          // Se tem filtro de paciente e não corresponde, excluir
          if (pacienteId && ag.pacienteId !== pacienteId) {
            return false;
          }
          
          // Se tem filtro de psicólogo e não corresponde, excluir
          if (psicologoIdParam && ag.psicologoId !== psicologoIdParam) {
            return false;
          }
          
          // Se tem filtro de filial e não corresponde, excluir
          if (filialId && ag.filialId !== filialId) {
            return false;
          }
          
          // Se tem filtro de data (sem intervalo) e não corresponde, excluir
          if (data && !dataInicio && !dataFim) {
            const dataAg = typeof ag.data === 'string' ? ag.data : ag.data.toISOString().split('T')[0];
            const dataStr = queryData.toISOString().split('T')[0];
            if (dataAg !== dataStr) {
              return false;
            }
          }
          
          // Se não tem nenhum filtro, exibir apenas os de hoje
          if (!pacienteId && !psicologoIdParam && !filialId && !data && !dataInicio && !dataFim) {
            const dataAg = typeof ag.data === 'string' ? ag.data : ag.data.toISOString().split('T')[0];
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const hojeStr = hoje.toISOString().split('T')[0];
            return dataAg === hojeStr;
          }
          
          // Passou por todos os filtros
          return true;
        });
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

      // Verificar e deletar atendimentos associados ao agendamento
      const atendimentosDoAgendamento = await storage.getAtendimentosByAgendamento(id);
      for (const atendimento of atendimentosDoAgendamento) {
        // Primeiro deletar pagamentos associados a cada atendimento
        const pagamentosAtendimento = await storage.getPagamentosByAtendimento(atendimento.id);
        for (const pagamento of pagamentosAtendimento) {
          await storage.deletePagamento(pagamento.id);
        }
        // Depois deleta o atendimento
        await storage.deleteAtendimento(atendimento.id);
      }
      
      // Agora podemos deletar o agendamento com segurança
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

  // Rotas para Pagamentos
  app.get("/api/pagamentos", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      // Filtros de data
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      // Obter todos os pagamentos
      const pagamentos = await storage.getAllPagamentos();
      
      // Enriquecer com informações relacionadas
      const pagamentosDetalhados = await Promise.all(
        pagamentos.map(async (pagamento) => {
          const atendimento = await storage.getAtendimento(pagamento.atendimentoId);
          let atendimentoCompleto = { ...atendimento };
          
          if (atendimento) {
            // Buscar paciente
            if (atendimento.pacienteId) {
              const paciente = await storage.getPaciente(atendimento.pacienteId);
              if (paciente) {
                const usuarioPaciente = await storage.getUser(paciente.usuarioId);
                atendimentoCompleto.paciente = { 
                  ...paciente, 
                  usuario: usuarioPaciente 
                };
              }
            }
            
            // Buscar psicólogo
            if (atendimento.psicologoId) {
              const psicologo = await storage.getPsicologo(atendimento.psicologoId);
              if (psicologo) {
                const usuarioPsicologo = await storage.getUser(psicologo.usuarioId);
                atendimentoCompleto.psicologo = { 
                  ...psicologo, 
                  usuario: usuarioPsicologo 
                };
              }
            }
            
            // Buscar plano de saúde, se houver
            if (atendimento.planoSaudeId) {
              const planoSaude = await storage.getPlanoSaude(atendimento.planoSaudeId);
              atendimentoCompleto.planoSaude = planoSaude;
            }
          }
          
          return {
            ...pagamento,
            atendimento: atendimentoCompleto
          };
        })
      );
      
      // Filtrar por data se necessário
      let pagamentosFiltrados = pagamentosDetalhados;
      
      if (dateFrom || dateTo) {
        pagamentosFiltrados = pagamentosDetalhados.filter(pagamento => {
          const dataAtendimento = pagamento.atendimento?.dataAtendimento 
            ? new Date(pagamento.atendimento.dataAtendimento) 
            : null;
            
          if (!dataAtendimento) return false;
          
          const aposDataInicial = !dateFrom || dataAtendimento >= dateFrom;
          const antesDataFinal = !dateTo || dataAtendimento <= dateTo;
          
          return aposDataInicial && antesDataFinal;
        });
      }
      
      res.json(pagamentosFiltrados);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      res.status(500).json({ mensagem: "Erro ao buscar pagamentos", erro: error });
    }
  });
  
  // Obter estatísticas de pagamentos para o dashboard financeiro
  app.get("/api/pagamentos/estatisticas", verificarAutenticacao, verificarNivelAcesso(["admin", "secretaria"]), async (req, res) => {
    try {
      // Filtros de data
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      // Obter todos os pagamentos
      const pagamentos = await storage.getAllPagamentos();
      
      // Filtrar por data se necessário
      let pagamentosFiltrados = pagamentos;
      
      // Calcular estatísticas
      const totalRecebido = pagamentosFiltrados
        .filter(p => p.status === "pago")
        .reduce((sum, p) => sum + p.valor, 0);
        
      const totalPendente = pagamentosFiltrados
        .filter(p => p.status === "pendente")
        .reduce((sum, p) => sum + p.valor, 0);
        
      const totalRepasses = pagamentosFiltrados
        .filter(p => p.status === "pago")
        .reduce((sum, p) => sum + (p.repassePsicologo || 0), 0);
        
      // Estatísticas por método de pagamento
      const pagamentosPorMetodo = pagamentosFiltrados.reduce((acc, p) => {
        const metodo = p.metodoPagamento || "outros";
        if (!acc[metodo]) acc[metodo] = 0;
        acc[metodo] += p.valor;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        totalRecebido,
        totalPendente,
        totalRepasses,
        totalLiquido: totalRecebido - totalRepasses,
        pagamentosPorMetodo
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de pagamentos:', error);
      res.status(500).json({ mensagem: "Erro ao buscar estatísticas de pagamentos", erro: error });
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
  
  // Endpoints relacionados à OpenAI API
  app.post("/api/openai/gerar-resumo", verificarAutenticacao, verificarNivelAcesso(["admin", "psicologo"]), async (req, res) => {
    try {
      const { transcricao } = req.body;
      
      if (!transcricao) {
        return res.status(400).json({ mensagem: "Transcrição não fornecida" });
      }
      
      // Usando o modelo GPT-4o para gerar resumos das sessões
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // O modelo mais avançado da OpenAI
        messages: [
          { 
            role: "system", 
            content: "Você é um psicólogo especializado em criar resumos de sessões terapêuticas. " +
                     "Gere um resumo estruturado, conciso e profissional da sessão, destacando:" +
                     "\n1. Principais temas abordados" +
                     "\n2. Estado emocional do paciente" +
                     "\n3. Técnicas discutidas ou sugeridas" +
                     "\n4. Progresso observado" +
                     "\n5. Plano para a próxima sessão" +
                     "\nManter linguagem técnica apropriada e preservar a confidencialidade." 
          },
          { 
            role: "user", 
            content: `Gere um resumo estruturado com base na transcrição da sessão:\n\n${transcricao}` 
          },
        ],
        temperature: 0.5,
        max_tokens: 1200,
      });
      
      const resumo = completion.choices[0].message.content;
      
      // Registrar a utilização da API
      logger.info("Resumo de sessão gerado com IA");
      
      res.json({ resumo });
    } catch (error) {
      console.error("Erro ao gerar resumo da sessão:", error);
      res.status(500).json({ 
        mensagem: "Ocorreu um erro ao gerar o resumo da sessão",
        erro: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Rotas adicionais para a funcionalidade de atendimento
  
  // Gerar link para teleconsulta
  app.post("/api/teleconsulta/gerar-link", verificarAutenticacao, verificarNivelAcesso(["admin", "psicologo"]), async (req, res) => {
    try {
      const { agendamentoId } = req.body;
      
      if (!agendamentoId) {
        return res.status(400).json({ mensagem: "ID do agendamento não fornecido" });
      }
      
      // Buscar agendamento para verificar se existe e é teleconsulta
      const agendamento = await storage.getAgendamento(agendamentoId);
      if (!agendamento) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }
      
      if (!agendamento.remoto) {
        return res.status(400).json({ mensagem: "Este agendamento não é uma teleconsulta" });
      }
      
      // Gerar um link único para a teleconsulta
      // Usando um ID aleatório para simular a criação de uma sala virtual segura
      const randomId = crypto.randomBytes(8).toString('hex');
      const link = `${randomId}-${agendamentoId}`;
      
      // Em uma implementação real, aqui salvaria o link em uma tabela de teleconsultas
      // com informações como duração máxima, quem pode acessar, etc.
      
      logger.info(`Link de teleconsulta gerado para agendamento ${agendamentoId}`);
      
      res.json({
        link,
        agendamentoId,
        dataGeracao: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao gerar link de teleconsulta:", error);
      res.status(500).json({ 
        mensagem: "Erro ao gerar link de teleconsulta", 
        erro: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Enviar link de teleconsulta para o paciente
  app.post("/api/teleconsulta/enviar-link", verificarAutenticacao, verificarNivelAcesso(["admin", "psicologo"]), async (req, res) => {
    try {
      const { agendamentoId, link, method } = req.body;
      
      if (!agendamentoId || !link || !method) {
        return res.status(400).json({ 
          mensagem: "Parâmetros inválidos. É necessário fornecer agendamentoId, link e method" 
        });
      }
      
      // Verificar se o agendamento existe
      const agendamento = await storage.getAgendamento(agendamentoId);
      if (!agendamento) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }
      
      // Buscar o paciente
      const paciente = await storage.getPaciente(agendamento.pacienteId);
      if (!paciente) {
        return res.status(404).json({ mensagem: "Paciente não encontrado" });
      }
      
      // Buscar dados de contato do paciente
      const pacienteUsuario = await storage.getUser(paciente.usuarioId);
      if (!pacienteUsuario) {
        return res.status(404).json({ mensagem: "Usuário do paciente não encontrado" });
      }
      
      const emailPaciente = pacienteUsuario.email;
      const telefonePaciente = paciente.telefone;
      
      // Mensagem a ser enviada
      const mensagem = `Olá ${pacienteUsuario.nome}, sua teleconsulta está agendada para hoje às ${agendamento.horaInicio}. Use este link para acessar: ${link}`;
      
      let resultado;
      
      // Enviar por e-mail ou WhatsApp conforme solicitado
      if (method === 'email' && emailPaciente) {
        // Em uma implementação real, aqui usaria SendGrid ou outro serviço de e-mail
        // Por enquanto, apenas simulamos o envio
        logger.info(`E-mail com link de teleconsulta enviado para: ${emailPaciente}`);
        resultado = { enviado: true, metodo: 'email', destinatario: emailPaciente };
      } 
      else if (method === 'whatsapp' && telefonePaciente) {
        // Em uma implementação real, aqui usaria a API do WhatsApp
        // Por enquanto, apenas simulamos o envio
        if (whatsappService) {
          await whatsappService.enviarMensagem(telefonePaciente, mensagem);
        }
        logger.info(`WhatsApp com link de teleconsulta enviado para: ${telefonePaciente}`);
        resultado = { enviado: true, metodo: 'whatsapp', destinatario: telefonePaciente };
      } 
      else {
        return res.status(400).json({ 
          mensagem: `Não foi possível enviar o link. Verifique se o método (${method}) é válido e se o paciente possui os dados de contato necessários.` 
        });
      }
      
      res.json({
        mensagem: "Link enviado com sucesso",
        ...resultado
      });
    } catch (error) {
      console.error("Erro ao enviar link de teleconsulta:", error);
      res.status(500).json({ 
        mensagem: "Erro ao enviar link de teleconsulta", 
        erro: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Rota para buscar atendimentos de um agendamento específico
  app.get("/api/atendimentos/agendamento/:id", verificarAutenticacao, async (req, res) => {
    try {
      const agendamentoId = parseInt(req.params.id);
      
      if (isNaN(agendamentoId)) {
        return res.status(400).json({ mensagem: "ID de agendamento inválido" });
      }
      
      const atendimentos = await storage.getAtendimentosByAgendamento(agendamentoId);
      
      res.json(atendimentos);
    } catch (error) {
      console.error("Erro ao buscar atendimentos do agendamento:", error);
      res.status(500).json({ 
        mensagem: "Erro ao buscar atendimentos", 
        erro: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Rota para buscar próximos agendamentos de um psicólogo
  app.get("/api/atendimentos/psicologo/:id", verificarAutenticacao, async (req, res) => {
    try {
      const psicologoId = parseInt(req.params.id);
      
      if (isNaN(psicologoId)) {
        return res.status(400).json({ mensagem: "ID de psicólogo inválido" });
      }

      // Verificar se o usuário logado é o psicólogo ou é um admin
      if (req.user?.tipo === "psicologo") {
        const psicologo = await storage.getPsicologoByUserId(req.user.id);
        if (!psicologo || psicologo.id !== psicologoId) {
          return res.status(403).json({ mensagem: "Acesso não autorizado" });
        }
      } else if (req.user?.tipo !== "admin") {
        return res.status(403).json({ mensagem: "Acesso não autorizado" });
      }
      
      // Buscar os atendimentos realizados por este psicólogo
      const atendimentos = await storage.getAtendimentosByPsicologo(psicologoId);
      
      // Buscar próximos agendamentos (a partir da data e hora atual)
      const agora = new Date();
      const dataHoje = agora.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      
      console.log(`Filtrando agendamentos a partir de: ${dataHoje} ${horaAtual}:${minutoAtual}`);
      
      // Buscar agendamentos através de funções existentes no storage
      let agendamentosFuturos = [];
      // Buscar agendamentos do psicólogo específico
      const agendamentosDoPsicologo = await storage.getAgendamentosByPsicologo(psicologoId);
      
      // Filtrar apenas os agendamentos futuros ou de hoje que ainda não aconteceram
      agendamentosFuturos = agendamentosDoPsicologo.filter((agendamento: any) => {
        // Verificar se o agendamento pertence ao psicólogo
        if (agendamento.psicologoId !== psicologoId) {
          return false;
        }
        
        // Converter data do agendamento para comparação
        const dataAgendamento = agendamento.data.split('T')[0];
        
        // Para agendamentos de hoje, verificar a hora
        if (dataAgendamento === dataHoje) {
          // Extrair hora e minuto do horário de início
          const [horaInicio, minutoInicio] = agendamento.horaInicio.split(':').map(Number);
          
          // Incluir todos os agendamentos de hoje independente da hora
          // Normalmente verificaríamos se a hora atual é menor que a hora do agendamento
          // mas para fins de teste e demonstração, vamos mostrar todos os agendamentos de hoje
          console.log(`Agendamento ${agendamento.id}, data: ${dataAgendamento}, hora: ${horaInicio}:${minutoInicio}, incluído: true`);
          
          return agendamento.status !== 'cancelado' && agendamento.status !== 'realizado';
        }
        
        // Para outros dias, verificar se a data é futura
        const incluido = dataAgendamento >= dataHoje && 
                         agendamento.status !== 'cancelado' && 
                         agendamento.status !== 'realizado';
                         
        console.log(`Agendamento ${agendamento.id}, data: ${dataAgendamento}, incluído: ${incluido}`);
        
        return incluido;
      });
      
      // Ordenar por data e hora
      agendamentosFuturos.sort((a: any, b: any) => {
        // Primeiro compara as datas
        const compareDatas = a.data.localeCompare(b.data);
        if (compareDatas !== 0) return compareDatas;
        
        // Se as datas forem iguais, compara as horas
        return a.horaInicio.localeCompare(b.horaInicio);
      });
      
      // Enriquecer os agendamentos com dados de pacientes e psicólogos
      const agendamentosDetalhados = await Promise.all(agendamentosFuturos.map(async (agendamento: any) => {
        const paciente = await storage.getPaciente(agendamento.pacienteId);
        const psicologo = await storage.getPsicologo(agendamento.psicologoId);
        const sala = agendamento.salaId ? await storage.getSala(agendamento.salaId) : null;
        const filial = agendamento.filialId ? await storage.getFilial(agendamento.filialId) : null;
        
        // Adicionar dados do usuário ao paciente e psicólogo
        let pacienteComUsuario = paciente;
        let psicologoComUsuario = psicologo;
        
        if (paciente) {
          const usuarioPaciente = await storage.getUser(paciente.usuarioId);
          pacienteComUsuario = {
            ...paciente,
            usuario: usuarioPaciente
          };
        }
        
        if (psicologo) {
          const usuarioPsicologo = await storage.getUser(psicologo.usuarioId);
          psicologoComUsuario = {
            ...psicologo,
            usuario: usuarioPsicologo
          };
        }
        
        return {
          ...agendamento,
          paciente: pacienteComUsuario,
          psicologo: psicologoComUsuario,
          sala,
          filial
        };
      }));
      
      res.json(agendamentosDetalhados);
    } catch (error) {
      console.error("Erro ao buscar próximos agendamentos do psicólogo:", error);
      res.status(500).json({ 
        mensagem: "Erro ao buscar próximos agendamentos", 
        erro: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Inicializar o servidor HTTP
  const httpServer = createServer(app);
  return httpServer;
}