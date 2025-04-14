import { 
  Usuario, InsertUsuario, 
  Paciente, InsertPaciente,
  Psicologo, InsertPsicologo,
  Filial, InsertFilial,
  Sala, InsertSala,
  PlanoSaude, InsertPlanoSaude,
  Agendamento, InsertAgendamento,
  Atendimento, InsertAtendimento,
  Prontuario, InsertProntuario,
  Pagamento, InsertPagamento,
  BloqueioHorario, InsertBloqueioHorario,
  DisponibilidadePsicologo, InsertDisponibilidadePsicologo,
  PacientePlanoSaude, InsertPacientePlanoSaude,
  Documento, InsertDocumento
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Usuarios
  getUser(id: number): Promise<Usuario | undefined>;
  getUserByEmail(email: string): Promise<Usuario | undefined>;
  createUser(user: InsertUsuario): Promise<Usuario>;
  updateUser(id: number, user: Partial<InsertUsuario>): Promise<Usuario | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersByTipo(tipo: string): Promise<Usuario[]>;
  getAllUsers(): Promise<Usuario[]>;

  // Pacientes
  getPaciente(id: number): Promise<Paciente | undefined>;
  getPacienteByUserId(userId: number): Promise<Paciente | undefined>;
  getPacientes(): Promise<Paciente[]>;
  createPaciente(paciente: InsertPaciente): Promise<Paciente>;
  updatePaciente(id: number, paciente: Partial<InsertPaciente>): Promise<Paciente | undefined>;
  deletePaciente(id: number): Promise<boolean>;

  // Psicólogos
  getPsicologo(id: number): Promise<Psicologo | undefined>;
  getPsicologoByUserId(userId: number): Promise<Psicologo | undefined>;
  getPsicologos(): Promise<Psicologo[]>;
  createPsicologo(psicologo: InsertPsicologo): Promise<Psicologo>;
  updatePsicologo(id: number, psicologo: Partial<InsertPsicologo>): Promise<Psicologo | undefined>;
  deletePsicologo(id: number): Promise<boolean>;

  // Filiais
  getFilial(id: number): Promise<Filial | undefined>;
  getFiliais(): Promise<Filial[]>;
  createFilial(filial: InsertFilial): Promise<Filial>;
  updateFilial(id: number, filial: Partial<InsertFilial>): Promise<Filial | undefined>;
  deleteFilial(id: number): Promise<boolean>;

  // Salas
  getSala(id: number): Promise<Sala | undefined>;
  getSalasByFilial(filialId: number): Promise<Sala[]>;
  getAllSalas(): Promise<Sala[]>;
  createSala(sala: InsertSala): Promise<Sala>;
  updateSala(id: number, sala: Partial<InsertSala>): Promise<Sala | undefined>;
  deleteSala(id: number): Promise<boolean>;

  // Planos de Saúde
  getPlanoSaude(id: number): Promise<PlanoSaude | undefined>;
  getPlanosSaude(): Promise<PlanoSaude[]>;
  createPlanoSaude(plano: InsertPlanoSaude): Promise<PlanoSaude>;
  updatePlanoSaude(id: number, plano: Partial<InsertPlanoSaude>): Promise<PlanoSaude | undefined>;
  deletePlanoSaude(id: number): Promise<boolean>;

  // Agendamentos
  getAgendamento(id: number): Promise<Agendamento | undefined>;
  getAgendamentosByPaciente(pacienteId: number): Promise<Agendamento[]>;
  getAgendamentosByPsicologo(psicologoId: number): Promise<Agendamento[]>;
  getAgendamentosByData(data: Date): Promise<Agendamento[]>;
  getAgendamentosByFilial(filialId: number): Promise<Agendamento[]>;
  getAllAgendamentos(): Promise<Agendamento[]>;
  createAgendamento(agendamento: InsertAgendamento): Promise<Agendamento>;
  updateAgendamento(id: number, agendamento: Partial<InsertAgendamento>): Promise<Agendamento | undefined>;
  deleteAgendamento(id: number): Promise<boolean>;

  // Atendimentos
  getAtendimento(id: number): Promise<Atendimento | undefined>;
  getAtendimentosByPaciente(pacienteId: number): Promise<Atendimento[]>;
  getAtendimentosByPsicologo(psicologoId: number): Promise<Atendimento[]>;
  getAtendimentosByAgendamento(agendamentoId: number): Promise<Atendimento[]>;
  createAtendimento(atendimento: InsertAtendimento): Promise<Atendimento>;
  updateAtendimento(id: number, atendimento: Partial<InsertAtendimento>): Promise<Atendimento | undefined>;
  deleteAtendimento(id: number): Promise<boolean>;

  // Prontuários
  getProntuario(id: number): Promise<Prontuario | undefined>;
  getProntuariosByPaciente(pacienteId: number): Promise<Prontuario[]>;
  createProntuario(prontuario: InsertProntuario): Promise<Prontuario>;
  updateProntuario(id: number, prontuario: Partial<InsertProntuario>): Promise<Prontuario | undefined>;
  deleteProntuario(id: number): Promise<boolean>;

  // Pagamentos
  getPagamento(id: number): Promise<Pagamento | undefined>;
  getPagamentosByAtendimento(atendimentoId: number): Promise<Pagamento[]>;
  getAllPagamentos(): Promise<Pagamento[]>;
  createPagamento(pagamento: InsertPagamento): Promise<Pagamento>;
  updatePagamento(id: number, pagamento: Partial<InsertPagamento>): Promise<Pagamento | undefined>;
  deletePagamento(id: number): Promise<boolean>;

  // Bloqueios de Horários
  getBloqueioHorario(id: number): Promise<BloqueioHorario | undefined>;
  getBloqueiosByPsicologo(psicologoId: number): Promise<BloqueioHorario[]>;
  createBloqueioHorario(bloqueio: InsertBloqueioHorario): Promise<BloqueioHorario>;
  updateBloqueioHorario(id: number, bloqueio: Partial<InsertBloqueioHorario>): Promise<BloqueioHorario | undefined>;
  deleteBloqueioHorario(id: number): Promise<boolean>;

  // Disponibilidade de Psicólogos
  getDisponibilidade(id: number): Promise<DisponibilidadePsicologo | undefined>;
  getDisponibilidadesByPsicologo(psicologoId: number): Promise<DisponibilidadePsicologo[]>;
  createDisponibilidade(disponibilidade: InsertDisponibilidadePsicologo): Promise<DisponibilidadePsicologo>;
  updateDisponibilidade(id: number, disponibilidade: Partial<InsertDisponibilidadePsicologo>): Promise<DisponibilidadePsicologo | undefined>;
  deleteDisponibilidade(id: number): Promise<boolean>;

  // Pacientes Planos de Saúde
  getPacientePlanoSaude(id: number): Promise<PacientePlanoSaude | undefined>;
  getPacientesPlanoSaudeByPaciente(pacienteId: number): Promise<PacientePlanoSaude[]>;
  getPacientesPlanoSaudeByPlano(planoId: number): Promise<PacientePlanoSaude[]>;
  createPacientePlanoSaude(pacientePlano: InsertPacientePlanoSaude): Promise<PacientePlanoSaude>;
  updatePacientePlanoSaude(id: number, pacientePlano: Partial<InsertPacientePlanoSaude>): Promise<PacientePlanoSaude | undefined>;
  deletePacientePlanoSaude(id: number): Promise<boolean>;

  // Documentos
  getDocumento(id: number): Promise<Documento | undefined>;
  getDocumentosByPaciente(pacienteId: number): Promise<Documento[]>;
  createDocumento(documento: InsertDocumento): Promise<Documento>;
  updateDocumento(id: number, documento: Partial<InsertDocumento>): Promise<Documento | undefined>;
  deleteDocumento(id: number): Promise<boolean>;

  // Sessão
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private usuarios: Map<number, Usuario>;
  private pacientes: Map<number, Paciente>;
  private psicologos: Map<number, Psicologo>;
  private filiais: Map<number, Filial>;
  private salas: Map<number, Sala>;
  private planosSaude: Map<number, PlanoSaude>;
  private agendamentos: Map<number, Agendamento>;
  private atendimentos: Map<number, Atendimento>;
  private prontuarios: Map<number, Prontuario>;
  private pagamentos: Map<number, Pagamento>;
  private bloqueiosHorarios: Map<number, BloqueioHorario>;
  private disponibilidadePsicologos: Map<number, DisponibilidadePsicologo>;
  private pacientesPlanosSaude: Map<number, PacientePlanoSaude>;
  private documentos: Map<number, Documento>;
  private currentIds: {
    usuario: number;
    paciente: number;
    psicologo: number;
    filial: number;
    sala: number;
    planoSaude: number;
    agendamento: number;
    atendimento: number;
    prontuario: number;
    pagamento: number;
    bloqueioHorario: number;
    disponibilidadePsicologo: number;
    pacientePlanoSaude: number;
    documento: number;
  };
  public sessionStore: session.Store;

  constructor() {
    this.usuarios = new Map();
    this.pacientes = new Map();
    this.psicologos = new Map();
    this.filiais = new Map();
    this.salas = new Map();
    this.planosSaude = new Map();
    this.agendamentos = new Map();
    this.atendimentos = new Map();
    this.prontuarios = new Map();
    this.pagamentos = new Map();
    this.bloqueiosHorarios = new Map();
    this.disponibilidadePsicologos = new Map();
    this.pacientesPlanosSaude = new Map();
    this.documentos = new Map();
    this.currentIds = {
      usuario: 1,
      paciente: 1,
      psicologo: 1,
      filial: 1,
      sala: 1,
      planoSaude: 1,
      agendamento: 1,
      atendimento: 1,
      prontuario: 1,
      pagamento: 1,
      bloqueioHorario: 1,
      disponibilidadePsicologo: 1,
      pacientePlanoSaude: 1,
      documento: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 horas
    });

    // Criar dados de exemplo para admin
    this.createUser({
      nome: "Administrador",
      email: "admin@psisystem.com",
      senha: "$2b$10$XVRnRZ8UI/W3CzXmxl0DheXcECVCgDqZPSaVVNYyNWKNv0i.MozlO", // senha123
      telefone: "(11) 99999-9999",
      cpf: "123.456.789-00",
      tipo: "admin",
      ativo: true
    });
  }

  // Implementação de Usuários
  async getUser(id: number): Promise<Usuario | undefined> {
    return this.usuarios.get(id);
  }

  async getUserByEmail(email: string): Promise<Usuario | undefined> {
    return Array.from(this.usuarios.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(user: InsertUsuario): Promise<Usuario> {
    const id = this.currentIds.usuario++;
    const newUser: Usuario = { ...user, id };
    this.usuarios.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUsuario>): Promise<Usuario | undefined> {
    const existingUser = this.usuarios.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.usuarios.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usuarios.delete(id);
  }

  async getUsersByTipo(tipo: string): Promise<Usuario[]> {
    return Array.from(this.usuarios.values()).filter(user => user.tipo === tipo);
  }
  
  async getAllUsers(): Promise<Usuario[]> {
    return Array.from(this.usuarios.values());
  }

  // Pacientes
  async getPaciente(id: number): Promise<Paciente | undefined> {
    return this.pacientes.get(id);
  }

  async getPacienteByUserId(userId: number): Promise<Paciente | undefined> {
    return Array.from(this.pacientes.values()).find(
      (paciente) => paciente.usuarioId === userId
    );
  }

  async getPacientes(): Promise<Paciente[]> {
    return Array.from(this.pacientes.values());
  }

  async createPaciente(paciente: InsertPaciente): Promise<Paciente> {
    const id = this.currentIds.paciente++;
    const newPaciente: Paciente = { ...paciente, id };
    this.pacientes.set(id, newPaciente);
    return newPaciente;
  }

  async updatePaciente(id: number, paciente: Partial<InsertPaciente>): Promise<Paciente | undefined> {
    const existingPaciente = this.pacientes.get(id);
    if (!existingPaciente) return undefined;
    
    const updatedPaciente = { ...existingPaciente, ...paciente };
    this.pacientes.set(id, updatedPaciente);
    return updatedPaciente;
  }

  async deletePaciente(id: number): Promise<boolean> {
    return this.pacientes.delete(id);
  }

  // Psicólogos
  async getPsicologo(id: number): Promise<Psicologo | undefined> {
    return this.psicologos.get(id);
  }

  async getPsicologoByUserId(userId: number): Promise<Psicologo | undefined> {
    return Array.from(this.psicologos.values()).find(
      (psicologo) => psicologo.usuarioId === userId
    );
  }

  async getPsicologos(): Promise<Psicologo[]> {
    return Array.from(this.psicologos.values());
  }

  async createPsicologo(psicologo: InsertPsicologo): Promise<Psicologo> {
    const id = this.currentIds.psicologo++;
    const newPsicologo: Psicologo = { ...psicologo, id };
    this.psicologos.set(id, newPsicologo);
    return newPsicologo;
  }

  async updatePsicologo(id: number, psicologo: Partial<InsertPsicologo>): Promise<Psicologo | undefined> {
    const existingPsicologo = this.psicologos.get(id);
    if (!existingPsicologo) return undefined;
    
    const updatedPsicologo = { ...existingPsicologo, ...psicologo };
    this.psicologos.set(id, updatedPsicologo);
    return updatedPsicologo;
  }

  async deletePsicologo(id: number): Promise<boolean> {
    return this.psicologos.delete(id);
  }

  // Filiais
  async getFilial(id: number): Promise<Filial | undefined> {
    return this.filiais.get(id);
  }

  async getFiliais(): Promise<Filial[]> {
    return Array.from(this.filiais.values());
  }

  async createFilial(filial: InsertFilial): Promise<Filial> {
    const id = this.currentIds.filial++;
    const newFilial: Filial = { ...filial, id };
    this.filiais.set(id, newFilial);
    return newFilial;
  }

  async updateFilial(id: number, filial: Partial<InsertFilial>): Promise<Filial | undefined> {
    const existingFilial = this.filiais.get(id);
    if (!existingFilial) return undefined;
    
    const updatedFilial = { ...existingFilial, ...filial };
    this.filiais.set(id, updatedFilial);
    return updatedFilial;
  }

  async deleteFilial(id: number): Promise<boolean> {
    return this.filiais.delete(id);
  }

  // Salas
  async getSala(id: number): Promise<Sala | undefined> {
    return this.salas.get(id);
  }

  async getSalasByFilial(filialId: number): Promise<Sala[]> {
    return Array.from(this.salas.values()).filter(
      (sala) => sala.filialId === filialId
    );
  }

  async getAllSalas(): Promise<Sala[]> {
    return Array.from(this.salas.values());
  }

  async createSala(sala: InsertSala): Promise<Sala> {
    const id = this.currentIds.sala++;
    const newSala: Sala = { ...sala, id };
    this.salas.set(id, newSala);
    return newSala;
  }

  async updateSala(id: number, sala: Partial<InsertSala>): Promise<Sala | undefined> {
    const existingSala = this.salas.get(id);
    if (!existingSala) return undefined;
    
    const updatedSala = { ...existingSala, ...sala };
    this.salas.set(id, updatedSala);
    return updatedSala;
  }

  async deleteSala(id: number): Promise<boolean> {
    return this.salas.delete(id);
  }

  // Planos de Saúde
  async getPlanoSaude(id: number): Promise<PlanoSaude | undefined> {
    return this.planosSaude.get(id);
  }

  async getPlanosSaude(): Promise<PlanoSaude[]> {
    return Array.from(this.planosSaude.values());
  }

  async createPlanoSaude(plano: InsertPlanoSaude): Promise<PlanoSaude> {
    const id = this.currentIds.planoSaude++;
    const newPlano: PlanoSaude = { ...plano, id };
    this.planosSaude.set(id, newPlano);
    return newPlano;
  }

  async updatePlanoSaude(id: number, plano: Partial<InsertPlanoSaude>): Promise<PlanoSaude | undefined> {
    const existingPlano = this.planosSaude.get(id);
    if (!existingPlano) return undefined;
    
    const updatedPlano = { ...existingPlano, ...plano };
    this.planosSaude.set(id, updatedPlano);
    return updatedPlano;
  }

  async deletePlanoSaude(id: number): Promise<boolean> {
    return this.planosSaude.delete(id);
  }

  // Agendamentos
  async getAgendamento(id: number): Promise<Agendamento | undefined> {
    return this.agendamentos.get(id);
  }

  async getAgendamentosByPaciente(pacienteId: number): Promise<Agendamento[]> {
    return Array.from(this.agendamentos.values()).filter(
      (agendamento) => agendamento.pacienteId === pacienteId
    );
  }

  async getAgendamentosByPsicologo(psicologoId: number): Promise<Agendamento[]> {
    return Array.from(this.agendamentos.values()).filter(
      (agendamento) => agendamento.psicologoId === psicologoId
    );
  }

  async getAgendamentosByData(data: Date): Promise<Agendamento[]> {
    const dataStr = data.toISOString().split('T')[0];
    
    return Array.from(this.agendamentos.values()).filter(
      (agendamento) => {
        const agendamentoDataStr = typeof agendamento.data === 'string'
          ? agendamento.data.split('T')[0]
          : agendamento.data.toISOString().split('T')[0];
          
        return agendamentoDataStr === dataStr;
      }
    );
  }

  async getAgendamentosByFilial(filialId: number): Promise<Agendamento[]> {
    return Array.from(this.agendamentos.values()).filter(
      (agendamento) => agendamento.filialId === filialId
    );
  }
  
  async getAllAgendamentos(): Promise<Agendamento[]> {
    return Array.from(this.agendamentos.values());
  }

  async createAgendamento(agendamento: InsertAgendamento): Promise<Agendamento> {
    const id = this.currentIds.agendamento++;
    const newAgendamento: Agendamento = { ...agendamento, id };
    this.agendamentos.set(id, newAgendamento);
    return newAgendamento;
  }

  async updateAgendamento(id: number, agendamento: Partial<InsertAgendamento>): Promise<Agendamento | undefined> {
    const existingAgendamento = this.agendamentos.get(id);
    if (!existingAgendamento) return undefined;
    
    const updatedAgendamento = { ...existingAgendamento, ...agendamento };
    this.agendamentos.set(id, updatedAgendamento);
    return updatedAgendamento;
  }

  async deleteAgendamento(id: number): Promise<boolean> {
    return this.agendamentos.delete(id);
  }

  // Atendimentos
  async getAtendimento(id: number): Promise<Atendimento | undefined> {
    return this.atendimentos.get(id);
  }

  async getAtendimentosByPaciente(pacienteId: number): Promise<Atendimento[]> {
    const agendamentos = await this.getAgendamentosByPaciente(pacienteId);
    const agendamentoIds = agendamentos.map(a => a.id);
    
    return Array.from(this.atendimentos.values()).filter(
      (atendimento) => agendamentoIds.includes(atendimento.agendamentoId)
    );
  }

  async getAtendimentosByPsicologo(psicologoId: number): Promise<Atendimento[]> {
    const agendamentos = await this.getAgendamentosByPsicologo(psicologoId);
    const agendamentoIds = agendamentos.map(a => a.id);
    
    return Array.from(this.atendimentos.values()).filter(
      (atendimento) => agendamentoIds.includes(atendimento.agendamentoId)
    );
  }

  async getAtendimentosByAgendamento(agendamentoId: number): Promise<Atendimento[]> {
    return Array.from(this.atendimentos.values()).filter(
      (atendimento) => atendimento.agendamentoId === agendamentoId
    );
  }

  async createAtendimento(atendimento: InsertAtendimento): Promise<Atendimento> {
    const id = this.currentIds.atendimento++;
    const newAtendimento: Atendimento = { ...atendimento, id };
    this.atendimentos.set(id, newAtendimento);
    return newAtendimento;
  }

  async updateAtendimento(id: number, atendimento: Partial<InsertAtendimento>): Promise<Atendimento | undefined> {
    const existingAtendimento = this.atendimentos.get(id);
    if (!existingAtendimento) return undefined;
    
    const updatedAtendimento = { ...existingAtendimento, ...atendimento };
    this.atendimentos.set(id, updatedAtendimento);
    return updatedAtendimento;
  }

  async deleteAtendimento(id: number): Promise<boolean> {
    return this.atendimentos.delete(id);
  }

  // Prontuários
  async getProntuario(id: number): Promise<Prontuario | undefined> {
    return this.prontuarios.get(id);
  }

  async getProntuariosByPaciente(pacienteId: number): Promise<Prontuario[]> {
    return Array.from(this.prontuarios.values()).filter(
      (prontuario) => prontuario.pacienteId === pacienteId
    );
  }

  async createProntuario(prontuario: InsertProntuario): Promise<Prontuario> {
    const id = this.currentIds.prontuario++;
    const newProntuario: Prontuario = { ...prontuario, id };
    this.prontuarios.set(id, newProntuario);
    return newProntuario;
  }

  async updateProntuario(id: number, prontuario: Partial<InsertProntuario>): Promise<Prontuario | undefined> {
    const existingProntuario = this.prontuarios.get(id);
    if (!existingProntuario) return undefined;
    
    const updatedProntuario = { ...existingProntuario, ...prontuario };
    this.prontuarios.set(id, updatedProntuario);
    return updatedProntuario;
  }

  async deleteProntuario(id: number): Promise<boolean> {
    return this.prontuarios.delete(id);
  }

  // Pagamentos
  async getPagamento(id: number): Promise<Pagamento | undefined> {
    return this.pagamentos.get(id);
  }

  async getPagamentosByAtendimento(atendimentoId: number): Promise<Pagamento[]> {
    return Array.from(this.pagamentos.values()).filter(
      (pagamento) => pagamento.atendimentoId === atendimentoId
    );
  }
  
  async getAllPagamentos(): Promise<Pagamento[]> {
    return Array.from(this.pagamentos.values());
  }

  async createPagamento(pagamento: InsertPagamento): Promise<Pagamento> {
    const id = this.currentIds.pagamento++;
    const newPagamento: Pagamento = { ...pagamento, id };
    this.pagamentos.set(id, newPagamento);
    return newPagamento;
  }

  async updatePagamento(id: number, pagamento: Partial<InsertPagamento>): Promise<Pagamento | undefined> {
    const existingPagamento = this.pagamentos.get(id);
    if (!existingPagamento) return undefined;
    
    const updatedPagamento = { ...existingPagamento, ...pagamento };
    this.pagamentos.set(id, updatedPagamento);
    return updatedPagamento;
  }

  async deletePagamento(id: number): Promise<boolean> {
    return this.pagamentos.delete(id);
  }

  // Bloqueios de Horários
  async getBloqueioHorario(id: number): Promise<BloqueioHorario | undefined> {
    return this.bloqueiosHorarios.get(id);
  }

  async getBloqueiosByPsicologo(psicologoId: number): Promise<BloqueioHorario[]> {
    return Array.from(this.bloqueiosHorarios.values()).filter(
      (bloqueio) => bloqueio.psicologoId === psicologoId
    );
  }

  async createBloqueioHorario(bloqueio: InsertBloqueioHorario): Promise<BloqueioHorario> {
    const id = this.currentIds.bloqueioHorario++;
    const newBloqueio: BloqueioHorario = { ...bloqueio, id };
    this.bloqueiosHorarios.set(id, newBloqueio);
    return newBloqueio;
  }

  async updateBloqueioHorario(id: number, bloqueio: Partial<InsertBloqueioHorario>): Promise<BloqueioHorario | undefined> {
    const existingBloqueio = this.bloqueiosHorarios.get(id);
    if (!existingBloqueio) return undefined;
    
    const updatedBloqueio = { ...existingBloqueio, ...bloqueio };
    this.bloqueiosHorarios.set(id, updatedBloqueio);
    return updatedBloqueio;
  }

  async deleteBloqueioHorario(id: number): Promise<boolean> {
    return this.bloqueiosHorarios.delete(id);
  }

  // Disponibilidade de Psicólogos
  async getDisponibilidade(id: number): Promise<DisponibilidadePsicologo | undefined> {
    return this.disponibilidadePsicologos.get(id);
  }

  async getDisponibilidadesByPsicologo(psicologoId: number): Promise<DisponibilidadePsicologo[]> {
    return Array.from(this.disponibilidadePsicologos.values()).filter(
      (disponibilidade) => disponibilidade.psicologoId === psicologoId
    );
  }

  async createDisponibilidade(disponibilidade: InsertDisponibilidadePsicologo): Promise<DisponibilidadePsicologo> {
    const id = this.currentIds.disponibilidadePsicologo++;
    const newDisponibilidade: DisponibilidadePsicologo = { ...disponibilidade, id };
    this.disponibilidadePsicologos.set(id, newDisponibilidade);
    return newDisponibilidade;
  }

  async updateDisponibilidade(id: number, disponibilidade: Partial<InsertDisponibilidadePsicologo>): Promise<DisponibilidadePsicologo | undefined> {
    const existingDisponibilidade = this.disponibilidadePsicologos.get(id);
    if (!existingDisponibilidade) return undefined;
    
    const updatedDisponibilidade = { ...existingDisponibilidade, ...disponibilidade };
    this.disponibilidadePsicologos.set(id, updatedDisponibilidade);
    return updatedDisponibilidade;
  }

  async deleteDisponibilidade(id: number): Promise<boolean> {
    return this.disponibilidadePsicologos.delete(id);
  }

  // Pacientes Planos de Saúde
  async getPacientePlanoSaude(id: number): Promise<PacientePlanoSaude | undefined> {
    return this.pacientesPlanosSaude.get(id);
  }

  async getPacientesPlanoSaudeByPaciente(pacienteId: number): Promise<PacientePlanoSaude[]> {
    return Array.from(this.pacientesPlanosSaude.values()).filter(
      (pacientePlano) => pacientePlano.pacienteId === pacienteId
    );
  }

  async createPacientePlanoSaude(pacientePlano: InsertPacientePlanoSaude): Promise<PacientePlanoSaude> {
    const id = this.currentIds.pacientePlanoSaude++;
    const newPacientePlano: PacientePlanoSaude = { ...pacientePlano, id };
    this.pacientesPlanosSaude.set(id, newPacientePlano);
    return newPacientePlano;
  }

  async updatePacientePlanoSaude(id: number, pacientePlano: Partial<InsertPacientePlanoSaude>): Promise<PacientePlanoSaude | undefined> {
    const existingPacientePlano = this.pacientesPlanosSaude.get(id);
    if (!existingPacientePlano) return undefined;
    
    const updatedPacientePlano = { ...existingPacientePlano, ...pacientePlano };
    this.pacientesPlanosSaude.set(id, updatedPacientePlano);
    return updatedPacientePlano;
  }

  async deletePacientePlanoSaude(id: number): Promise<boolean> {
    return this.pacientesPlanosSaude.delete(id);
  }

  // Documentos
  async getDocumento(id: number): Promise<Documento | undefined> {
    return this.documentos.get(id);
  }

  async getDocumentosByPaciente(pacienteId: number): Promise<Documento[]> {
    return Array.from(this.documentos.values()).filter(
      (documento) => documento.pacienteId === pacienteId
    );
  }

  async createDocumento(documento: InsertDocumento): Promise<Documento> {
    const id = this.currentIds.documento++;
    const newDocumento: Documento = { ...documento, id };
    this.documentos.set(id, newDocumento);
    return newDocumento;
  }

  async updateDocumento(id: number, documento: Partial<InsertDocumento>): Promise<Documento | undefined> {
    const existingDocumento = this.documentos.get(id);
    if (!existingDocumento) return undefined;
    
    const updatedDocumento = { ...existingDocumento, ...documento };
    this.documentos.set(id, updatedDocumento);
    return updatedDocumento;
  }

  async deleteDocumento(id: number): Promise<boolean> {
    return this.documentos.delete(id);
  }
}

// Importa a implementação do banco de dados
import { DatabaseStorage } from "./db-storage";

// Escolhe entre armazenamento em memória ou banco de dados com base em uma variável de ambiente
// Por padrão, usa o banco de dados
export const storage = process.env.USE_MEMORY_STORAGE === "true" 
  ? new MemStorage() 
  : new DatabaseStorage();
