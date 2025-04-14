import { 
  Usuario, InsertUsuario, 
  Paciente, InsertPaciente, 
  Psicologo, InsertPsicologo,
  Filial, InsertFilial,
  Sala, InsertSala,
  PlanoSaude, InsertPlanoSaude,
  PacientePlanoSaude, InsertPacientePlanoSaude,
  Agendamento, InsertAgendamento,
  Atendimento, InsertAtendimento,
  Prontuario, InsertProntuario,
  Pagamento, InsertPagamento,
  BloqueioHorario, InsertBloqueioHorario,
  DisponibilidadePsicologo, InsertDisponibilidadePsicologo,
  Documento, InsertDocumento,
  usuarios,
  pacientes,
  psicologos,
  filiais,
  salas,
  planosSaude,
  pacientesPlanosSaude,
  agendamentos,
  atendimentos,
  prontuarios,
  pagamentos,
  bloqueiosHorarios,
  disponibilidadePsicologos,
  documentos
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;
import { IStorage } from "./storage";

// Criar pool para o store de sessão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true
    });
  }

  // USUARIOS
  async getUser(id: number): Promise<Usuario | undefined> {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<Usuario | undefined> {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email));
    return user;
  }

  async createUser(user: InsertUsuario): Promise<Usuario> {
    const [createdUser] = await db.insert(usuarios).values(user).returning();
    return createdUser;
  }

  async updateUser(id: number, user: Partial<InsertUsuario>): Promise<Usuario | undefined> {
    const [updatedUser] = await db.update(usuarios).set(user).where(eq(usuarios.id, id)).returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(usuarios).where(eq(usuarios.id, id));
    return result.rowCount > 0;
  }

  async getUsersByTipo(tipo: string): Promise<Usuario[]> {
    return await db.select().from(usuarios).where(eq(usuarios.tipo, tipo));
  }
  
  async getAllUsers(): Promise<Usuario[]> {
    return await db.select().from(usuarios);
  }

  // PACIENTES
  async getPaciente(id: number): Promise<Paciente | undefined> {
    const [paciente] = await db.select().from(pacientes).where(eq(pacientes.id, id));
    return paciente;
  }

  async getPacienteByUserId(userId: number): Promise<Paciente | undefined> {
    const [paciente] = await db.select().from(pacientes).where(eq(pacientes.usuarioId, userId));
    return paciente;
  }

  async getPacientes(): Promise<Paciente[]> {
    return await db.select().from(pacientes);
  }

  async createPaciente(paciente: InsertPaciente): Promise<Paciente> {
    const [createdPaciente] = await db.insert(pacientes).values(paciente).returning();
    return createdPaciente;
  }

  async updatePaciente(id: number, paciente: Partial<InsertPaciente>): Promise<Paciente | undefined> {
    const [updatedPaciente] = await db.update(pacientes).set(paciente).where(eq(pacientes.id, id)).returning();
    return updatedPaciente;
  }

  async deletePaciente(id: number): Promise<boolean> {
    const result = await db.delete(pacientes).where(eq(pacientes.id, id));
    return result.rowCount > 0;
  }

  // PSICOLOGOS
  async getPsicologo(id: number): Promise<Psicologo | undefined> {
    const [psicologo] = await db.select().from(psicologos).where(eq(psicologos.id, id));
    return psicologo;
  }

  async getPsicologoByUserId(userId: number): Promise<Psicologo | undefined> {
    const [psicologo] = await db.select().from(psicologos).where(eq(psicologos.usuarioId, userId));
    return psicologo;
  }

  async getPsicologos(): Promise<Psicologo[]> {
    return await db.select().from(psicologos);
  }

  async createPsicologo(psicologo: InsertPsicologo): Promise<Psicologo> {
    const [createdPsicologo] = await db.insert(psicologos).values(psicologo).returning();
    return createdPsicologo;
  }

  async updatePsicologo(id: number, psicologo: Partial<InsertPsicologo>): Promise<Psicologo | undefined> {
    const [updatedPsicologo] = await db.update(psicologos).set(psicologo).where(eq(psicologos.id, id)).returning();
    return updatedPsicologo;
  }

  async deletePsicologo(id: number): Promise<boolean> {
    const result = await db.delete(psicologos).where(eq(psicologos.id, id));
    return result.rowCount > 0;
  }

  // FILIAIS
  async getFilial(id: number): Promise<Filial | undefined> {
    const [filial] = await db.select().from(filiais).where(eq(filiais.id, id));
    return filial;
  }

  async getFiliais(): Promise<Filial[]> {
    return await db.select().from(filiais);
  }

  async createFilial(filial: InsertFilial): Promise<Filial> {
    const [createdFilial] = await db.insert(filiais).values(filial).returning();
    return createdFilial;
  }

  async updateFilial(id: number, filial: Partial<InsertFilial>): Promise<Filial | undefined> {
    const [updatedFilial] = await db.update(filiais).set(filial).where(eq(filiais.id, id)).returning();
    return updatedFilial;
  }

  async deleteFilial(id: number): Promise<boolean> {
    const result = await db.delete(filiais).where(eq(filiais.id, id));
    return result.rowCount > 0;
  }

  // SALAS
  async getSala(id: number): Promise<Sala | undefined> {
    const [sala] = await db.select().from(salas).where(eq(salas.id, id));
    return sala;
  }

  async getSalasByFilial(filialId: number): Promise<Sala[]> {
    return await db.select().from(salas).where(eq(salas.filialId, filialId));
  }

  async getAllSalas(): Promise<Sala[]> {
    return await db.select().from(salas);
  }

  async createSala(sala: InsertSala): Promise<Sala> {
    const [createdSala] = await db.insert(salas).values(sala).returning();
    return createdSala;
  }

  async updateSala(id: number, sala: Partial<InsertSala>): Promise<Sala | undefined> {
    const [updatedSala] = await db.update(salas).set(sala).where(eq(salas.id, id)).returning();
    return updatedSala;
  }

  async deleteSala(id: number): Promise<boolean> {
    const result = await db.delete(salas).where(eq(salas.id, id));
    return result.rowCount > 0;
  }

  // PLANOS DE SAÚDE
  async getPlanoSaude(id: number): Promise<PlanoSaude | undefined> {
    const [plano] = await db.select().from(planosSaude).where(eq(planosSaude.id, id));
    return plano;
  }

  async getPlanosSaude(): Promise<PlanoSaude[]> {
    return await db.select().from(planosSaude);
  }

  async createPlanoSaude(plano: InsertPlanoSaude): Promise<PlanoSaude> {
    const [createdPlano] = await db.insert(planosSaude).values(plano).returning();
    return createdPlano;
  }

  async updatePlanoSaude(id: number, plano: Partial<InsertPlanoSaude>): Promise<PlanoSaude | undefined> {
    const [updatedPlano] = await db.update(planosSaude).set(plano).where(eq(planosSaude.id, id)).returning();
    return updatedPlano;
  }

  async deletePlanoSaude(id: number): Promise<boolean> {
    const result = await db.delete(planosSaude).where(eq(planosSaude.id, id));
    return result.rowCount > 0;
  }

  // AGENDAMENTOS
  async getAgendamento(id: number): Promise<Agendamento | undefined> {
    const [agendamento] = await db.select().from(agendamentos).where(eq(agendamentos.id, id));
    return agendamento;
  }

  async getAgendamentosByPaciente(pacienteId: number): Promise<Agendamento[]> {
    return await db.select().from(agendamentos).where(eq(agendamentos.pacienteId, pacienteId));
  }

  async getAgendamentosByPsicologo(psicologoId: number): Promise<Agendamento[]> {
    return await db.select().from(agendamentos).where(eq(agendamentos.psicologoId, psicologoId));
  }

  async getAgendamentosByData(data: Date): Promise<Agendamento[]> {
    const dataFormatada = new Date(data).toISOString().split('T')[0];
    return await db.select().from(agendamentos).where(
      sql`CAST(${agendamentos.data} AS TEXT) = ${dataFormatada}`
    );
  }

  async getAgendamentosByFilial(filialId: number): Promise<Agendamento[]> {
    return await db.select().from(agendamentos).where(eq(agendamentos.filialId, filialId));
  }
  
  async getAllAgendamentos(): Promise<Agendamento[]> {
    return await db.select().from(agendamentos);
  }

  async createAgendamento(agendamento: InsertAgendamento): Promise<Agendamento> {
    const [createdAgendamento] = await db.insert(agendamentos).values(agendamento).returning();
    return createdAgendamento;
  }

  async updateAgendamento(id: number, agendamento: Partial<InsertAgendamento>): Promise<Agendamento | undefined> {
    const [updatedAgendamento] = await db.update(agendamentos).set(agendamento).where(eq(agendamentos.id, id)).returning();
    return updatedAgendamento;
  }

  async deleteAgendamento(id: number): Promise<boolean> {
    const result = await db.delete(agendamentos).where(eq(agendamentos.id, id));
    return result.rowCount > 0;
  }

  // ATENDIMENTOS
  async getAtendimento(id: number): Promise<Atendimento | undefined> {
    const [atendimento] = await db.select().from(atendimentos).where(eq(atendimentos.id, id));
    return atendimento;
  }

  async getAtendimentosByPaciente(pacienteId: number): Promise<Atendimento[]> {
    const result = await db.select()
      .from(atendimentos)
      .innerJoin(agendamentos, eq(atendimentos.agendamentoId, agendamentos.id))
      .where(eq(agendamentos.pacienteId, pacienteId));
    
    return result.map(row => row.atendimentos);
  }

  async getAtendimentosByPsicologo(psicologoId: number): Promise<Atendimento[]> {
    const result = await db.select()
      .from(atendimentos)
      .innerJoin(agendamentos, eq(atendimentos.agendamentoId, agendamentos.id))
      .where(eq(agendamentos.psicologoId, psicologoId));
    
    return result.map(row => row.atendimentos);
  }

  async getAtendimentosByAgendamento(agendamentoId: number): Promise<Atendimento[]> {
    return await db.select().from(atendimentos).where(eq(atendimentos.agendamentoId, agendamentoId));
  }

  async createAtendimento(atendimento: InsertAtendimento): Promise<Atendimento> {
    const [createdAtendimento] = await db.insert(atendimentos).values(atendimento).returning();
    return createdAtendimento;
  }

  async updateAtendimento(id: number, atendimento: Partial<InsertAtendimento>): Promise<Atendimento | undefined> {
    const [updatedAtendimento] = await db.update(atendimentos).set(atendimento).where(eq(atendimentos.id, id)).returning();
    return updatedAtendimento;
  }

  async deleteAtendimento(id: number): Promise<boolean> {
    const result = await db.delete(atendimentos).where(eq(atendimentos.id, id));
    return result.rowCount > 0;
  }

  // PRONTUÁRIOS
  async getProntuario(id: number): Promise<Prontuario | undefined> {
    const [prontuario] = await db.select().from(prontuarios).where(eq(prontuarios.id, id));
    return prontuario;
  }

  async getProntuariosByPaciente(pacienteId: number): Promise<Prontuario[]> {
    return await db.select().from(prontuarios).where(eq(prontuarios.pacienteId, pacienteId));
  }

  async createProntuario(prontuario: InsertProntuario): Promise<Prontuario> {
    const [createdProntuario] = await db.insert(prontuarios).values(prontuario).returning();
    return createdProntuario;
  }

  async updateProntuario(id: number, prontuario: Partial<InsertProntuario>): Promise<Prontuario | undefined> {
    const [updatedProntuario] = await db.update(prontuarios).set(prontuario).where(eq(prontuarios.id, id)).returning();
    return updatedProntuario;
  }

  async deleteProntuario(id: number): Promise<boolean> {
    const result = await db.delete(prontuarios).where(eq(prontuarios.id, id));
    return result.rowCount > 0;
  }

  // PAGAMENTOS
  async getPagamento(id: number): Promise<Pagamento | undefined> {
    const [pagamento] = await db.select().from(pagamentos).where(eq(pagamentos.id, id));
    return pagamento;
  }

  async getPagamentosByAtendimento(atendimentoId: number): Promise<Pagamento[]> {
    return await db.select().from(pagamentos).where(eq(pagamentos.atendimentoId, atendimentoId));
  }
  
  async getAllPagamentos(): Promise<Pagamento[]> {
    return await db.select().from(pagamentos);
  }

  async createPagamento(pagamento: InsertPagamento): Promise<Pagamento> {
    const [createdPagamento] = await db.insert(pagamentos).values(pagamento).returning();
    return createdPagamento;
  }

  async updatePagamento(id: number, pagamento: Partial<InsertPagamento>): Promise<Pagamento | undefined> {
    const [updatedPagamento] = await db.update(pagamentos).set(pagamento).where(eq(pagamentos.id, id)).returning();
    return updatedPagamento;
  }

  async deletePagamento(id: number): Promise<boolean> {
    const result = await db.delete(pagamentos).where(eq(pagamentos.id, id));
    return result.rowCount > 0;
  }

  // BLOQUEIOS DE HORÁRIOS
  async getBloqueioHorario(id: number): Promise<BloqueioHorario | undefined> {
    const [bloqueio] = await db.select().from(bloqueiosHorarios).where(eq(bloqueiosHorarios.id, id));
    return bloqueio;
  }

  async getBloqueiosByPsicologo(psicologoId: number): Promise<BloqueioHorario[]> {
    return await db.select().from(bloqueiosHorarios).where(eq(bloqueiosHorarios.psicologoId, psicologoId));
  }

  async createBloqueioHorario(bloqueio: InsertBloqueioHorario): Promise<BloqueioHorario> {
    const [createdBloqueio] = await db.insert(bloqueiosHorarios).values(bloqueio).returning();
    return createdBloqueio;
  }

  async updateBloqueioHorario(id: number, bloqueio: Partial<InsertBloqueioHorario>): Promise<BloqueioHorario | undefined> {
    const [updatedBloqueio] = await db.update(bloqueiosHorarios).set(bloqueio).where(eq(bloqueiosHorarios.id, id)).returning();
    return updatedBloqueio;
  }

  async deleteBloqueioHorario(id: number): Promise<boolean> {
    const result = await db.delete(bloqueiosHorarios).where(eq(bloqueiosHorarios.id, id));
    return result.rowCount > 0;
  }

  // DISPONIBILIDADE DE PSICÓLOGOS
  async getDisponibilidade(id: number): Promise<DisponibilidadePsicologo | undefined> {
    const [disponibilidade] = await db.select().from(disponibilidadePsicologos).where(eq(disponibilidadePsicologos.id, id));
    return disponibilidade;
  }

  async getDisponibilidadesByPsicologo(psicologoId: number): Promise<DisponibilidadePsicologo[]> {
    return await db.select().from(disponibilidadePsicologos).where(eq(disponibilidadePsicologos.psicologoId, psicologoId));
  }

  async createDisponibilidade(disponibilidade: InsertDisponibilidadePsicologo): Promise<DisponibilidadePsicologo> {
    const [createdDisponibilidade] = await db.insert(disponibilidadePsicologos).values(disponibilidade).returning();
    return createdDisponibilidade;
  }

  async updateDisponibilidade(id: number, disponibilidade: Partial<InsertDisponibilidadePsicologo>): Promise<DisponibilidadePsicologo | undefined> {
    const [updatedDisponibilidade] = await db.update(disponibilidadePsicologos).set(disponibilidade).where(eq(disponibilidadePsicologos.id, id)).returning();
    return updatedDisponibilidade;
  }

  async deleteDisponibilidade(id: number): Promise<boolean> {
    const result = await db.delete(disponibilidadePsicologos).where(eq(disponibilidadePsicologos.id, id));
    return result.rowCount > 0;
  }

  // PACIENTES PLANOS DE SAÚDE
  async getPacientePlanoSaude(id: number): Promise<PacientePlanoSaude | undefined> {
    const [pacientePlano] = await db.select().from(pacientesPlanosSaude).where(eq(pacientesPlanosSaude.id, id));
    return pacientePlano;
  }

  async getPacientesPlanoSaudeByPaciente(pacienteId: number): Promise<PacientePlanoSaude[]> {
    return await db.select().from(pacientesPlanosSaude).where(eq(pacientesPlanosSaude.pacienteId, pacienteId));
  }

  async getPacientesPlanoSaudeByPlano(planoId: number): Promise<PacientePlanoSaude[]> {
    return await db.select().from(pacientesPlanosSaude).where(eq(pacientesPlanosSaude.planoSaudeId, planoId));
  }

  async createPacientePlanoSaude(pacientePlano: InsertPacientePlanoSaude): Promise<PacientePlanoSaude> {
    const [createdPacientePlano] = await db.insert(pacientesPlanosSaude).values(pacientePlano).returning();
    return createdPacientePlano;
  }

  async updatePacientePlanoSaude(id: number, pacientePlano: Partial<InsertPacientePlanoSaude>): Promise<PacientePlanoSaude | undefined> {
    const [updatedPacientePlano] = await db.update(pacientesPlanosSaude).set(pacientePlano).where(eq(pacientesPlanosSaude.id, id)).returning();
    return updatedPacientePlano;
  }

  async deletePacientePlanoSaude(id: number): Promise<boolean> {
    const result = await db.delete(pacientesPlanosSaude).where(eq(pacientesPlanosSaude.id, id));
    return result.rowCount > 0;
  }

  // DOCUMENTOS
  async getDocumento(id: number): Promise<Documento | undefined> {
    const [documento] = await db.select().from(documentos).where(eq(documentos.id, id));
    return documento;
  }

  async getDocumentosByPaciente(pacienteId: number): Promise<Documento[]> {
    return await db.select().from(documentos).where(eq(documentos.pacienteId, pacienteId));
  }

  async createDocumento(documento: InsertDocumento): Promise<Documento> {
    const [createdDocumento] = await db.insert(documentos).values(documento).returning();
    return createdDocumento;
  }

  async updateDocumento(id: number, documento: Partial<InsertDocumento>): Promise<Documento | undefined> {
    const [updatedDocumento] = await db.update(documentos).set(documento).where(eq(documentos.id, id)).returning();
    return updatedDocumento;
  }

  async deleteDocumento(id: number): Promise<boolean> {
    const result = await db.delete(documentos).where(eq(documentos.id, id));
    return result.rowCount > 0;
  }
}