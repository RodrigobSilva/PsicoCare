import { pgTable, text, serial, integer, boolean, timestamp, date, time, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Usuários (Base para todos os tipos de usuários)
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  telefone: text("telefone"),
  cpf: text("cpf").unique(),
  tipo: text("tipo").notNull(), // 'admin', 'psicologo', 'secretaria', 'paciente'
  ativo: boolean("ativo").default(true),
});

// Pacientes
export const pacientes = pgTable("pacientes", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  dataNascimento: date("data_nascimento"),
  genero: text("genero"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  cep: text("cep"),
  observacoes: text("observacoes"),
});

// Prontuário
export const prontuarios = pgTable("prontuarios", {
  id: serial("id").primaryKey(),
  pacienteId: integer("paciente_id").references(() => pacientes.id).notNull(),
  dataRegistro: timestamp("data_registro").defaultNow(),
  descricao: text("descricao").notNull(),
  diagnostico: text("diagnostico"),
  tratamento: text("tratamento"),
  psicologoId: integer("psicologo_id").references(() => psicologos.id).notNull(),
});

// Psicólogos
export const psicologos = pgTable("psicologos", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  crp: text("crp").notNull(),
  especialidade: text("especialidade"),
  formacao: text("formacao"),
  curriculo: text("curriculo"),
  redesSociais: text("redes_sociais"),
  enderecoConsultorio: text("endereco_consultorio"),
  fotoUrl: text("foto_url"),
});

// Filiais
export const filiais = pgTable("filiais", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull(),
  cidade: text("cidade").notNull(),
  estado: text("estado").notNull(),
  telefone: text("telefone"),
  ativa: boolean("ativa").default(true),
});

// Salas
export const salas = pgTable("salas", {
  id: serial("id").primaryKey(),
  filialId: integer("filial_id").references(() => filiais.id).notNull(),
  nome: text("nome").notNull(),
  capacidade: integer("capacidade"),
  descricao: text("descricao"),
  ativa: boolean("ativa").default(true),
});

// Disponibilidade de Psicólogos
export const disponibilidadePsicologos = pgTable("disponibilidade_psicologos", {
  id: serial("id").primaryKey(),
  psicologoId: integer("psicologo_id").references(() => psicologos.id).notNull(),
  diaSemana: integer("dia_semana").notNull(), // 0-6 (domingo-sábado)
  horaInicio: time("hora_inicio").notNull(),
  horaFim: time("hora_fim").notNull(),
  remoto: boolean("remoto").default(false),
  ativo: boolean("ativo").default(true),
});

// Bloqueios de Horários (férias, feriados, etc)
export const bloqueiosHorarios = pgTable("bloqueios_horarios", {
  id: serial("id").primaryKey(),
  psicologoId: integer("psicologo_id").references(() => psicologos.id).notNull(),
  dataInicio: date("data_inicio").notNull(),
  dataFim: date("data_fim").notNull(),
  motivo: text("motivo"),
  aprovado: boolean("aprovado").default(false),
});

// Planos de Saúde
export const planosSaude = pgTable("planos_saude", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  codigo: text("codigo"),
  valorConsulta: integer("valor_consulta"), // Em centavos
  percentualRepasse: integer("percentual_repasse"), // Porcentagem
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
});

// Pacientes de Planos de Saúde
export const pacientesPlanosSaude = pgTable("pacientes_planos_saude", {
  id: serial("id").primaryKey(),
  pacienteId: integer("paciente_id").references(() => pacientes.id).notNull(),
  planoSaudeId: integer("plano_saude_id").references(() => planosSaude.id).notNull(),
  numeroCarteirinha: text("numero_carteirinha").notNull(),
  dataValidade: date("data_validade"),
});

// Agendamentos
export const agendamentos = pgTable("agendamentos", {
  id: serial("id").primaryKey(),
  pacienteId: integer("paciente_id").references(() => pacientes.id).notNull(),
  psicologoId: integer("psicologo_id").references(() => psicologos.id).notNull(),
  salaId: integer("sala_id").references(() => salas.id),
  filialId: integer("filial_id").references(() => filiais.id).notNull(),
  data: date("data").notNull(),
  horaInicio: time("hora_inicio").notNull(),
  horaFim: time("hora_fim").notNull(),
  status: text("status").notNull().default("agendado"), // agendado, confirmado, cancelado, realizado
  tipoAtendimento: text("tipo_atendimento").notNull(), // primeira_consulta, retorno, avaliacao, etc
  observacao: text("observacao"),
  remoto: boolean("remoto").default(false),
  planoSaudeId: integer("plano_saude_id").references(() => planosSaude.id),
  particular: boolean("particular").default(false),
  sublocacao: boolean("sublocacao").default(false),
  valorConsulta: integer("valor_consulta"), // Em centavos
});

// Atendimentos (registros de sessões realizadas)
export const atendimentos = pgTable("atendimentos", {
  id: serial("id").primaryKey(),
  agendamentoId: integer("agendamento_id").references(() => agendamentos.id).notNull(),
  dataAtendimento: timestamp("data_atendimento").defaultNow(),
  observacoes: text("observacoes"),
  diagnostico: text("diagnostico"),
  evolucao: text("evolucao"),
  encaminhamento: text("encaminhamento"),
  duracao: integer("duracao"), // em minutos
});

// Pagamentos
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  atendimentoId: integer("atendimento_id").references(() => atendimentos.id).notNull(),
  valor: integer("valor").notNull(), // Em centavos
  metodoPagamento: text("metodo_pagamento").notNull(), // dinheiro, cartão, plano_saude
  status: text("status").notNull().default("pendente"), // pendente, pago, cancelado
  dataRegistro: timestamp("data_registro").defaultNow(),
  dataRecebimento: timestamp("data_recebimento"),
  repassePsicologo: integer("repasse_psicologo"), // Em centavos
});

// Documentos
export const documentos = pgTable("documentos", {
  id: serial("id").primaryKey(),
  pacienteId: integer("paciente_id").references(() => pacientes.id).notNull(),
  psicologoId: integer("psicologo_id").references(() => psicologos.id).notNull(),
  tipo: text("tipo").notNull(), // atestado, laudo, declaracao, etc
  dataEmissao: timestamp("data_emissao").defaultNow(),
  conteudo: text("conteudo").notNull(),
  assinado: boolean("assinado").default(false),
});

// Schemas de inserção
export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ id: true });
export const insertPacienteSchema = createInsertSchema(pacientes).omit({ id: true });
export const insertProntuarioSchema = createInsertSchema(prontuarios).omit({ id: true });
export const insertPsicologoSchema = createInsertSchema(psicologos).omit({ id: true });
export const insertFilialSchema = createInsertSchema(filiais).omit({ id: true });
export const insertSalaSchema = createInsertSchema(salas).omit({ id: true });
export const insertDisponibilidadePsicologoSchema = createInsertSchema(disponibilidadePsicologos).omit({ id: true });
export const insertBloqueioHorarioSchema = createInsertSchema(bloqueiosHorarios).omit({ id: true });
export const insertPlanoSaudeSchema = createInsertSchema(planosSaude).omit({ id: true });
export const insertPacientePlanoSaudeSchema = createInsertSchema(pacientesPlanosSaude).omit({ id: true });
export const insertAgendamentoSchema = createInsertSchema(agendamentos).omit({ id: true });
export const insertAtendimentoSchema = createInsertSchema(atendimentos).omit({ id: true });
export const insertPagamentoSchema = createInsertSchema(pagamentos).omit({ id: true });
export const insertDocumentoSchema = createInsertSchema(documentos).omit({ id: true });

// Tipos de inserção
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type InsertPaciente = z.infer<typeof insertPacienteSchema>;
export type InsertProntuario = z.infer<typeof insertProntuarioSchema>;
export type InsertPsicologo = z.infer<typeof insertPsicologoSchema>;
export type InsertFilial = z.infer<typeof insertFilialSchema>;
export type InsertSala = z.infer<typeof insertSalaSchema>;
export type InsertDisponibilidadePsicologo = z.infer<typeof insertDisponibilidadePsicologoSchema>;
export type InsertBloqueioHorario = z.infer<typeof insertBloqueioHorarioSchema>;
export type InsertPlanoSaude = z.infer<typeof insertPlanoSaudeSchema>;
export type InsertPacientePlanoSaude = z.infer<typeof insertPacientePlanoSaudeSchema>;
export type InsertAgendamento = z.infer<typeof insertAgendamentoSchema>;
export type InsertAtendimento = z.infer<typeof insertAtendimentoSchema>;
export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;
export type InsertDocumento = z.infer<typeof insertDocumentoSchema>;

// Tipos de seleção
export type Usuario = typeof usuarios.$inferSelect;
export type Paciente = typeof pacientes.$inferSelect;
export type Prontuario = typeof prontuarios.$inferSelect;
export type Psicologo = typeof psicologos.$inferSelect;
export type Filial = typeof filiais.$inferSelect;
export type Sala = typeof salas.$inferSelect;
export type DisponibilidadePsicologo = typeof disponibilidadePsicologos.$inferSelect;
export type BloqueioHorario = typeof bloqueiosHorarios.$inferSelect;
export type PlanoSaude = typeof planosSaude.$inferSelect;
export type PacientePlanoSaude = typeof pacientesPlanosSaude.$inferSelect;
export type Agendamento = typeof agendamentos.$inferSelect;
export type Atendimento = typeof atendimentos.$inferSelect;
export type Pagamento = typeof pagamentos.$inferSelect;
export type Documento = typeof documentos.$inferSelect;

// Schema de login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres")
});

export type LoginData = z.infer<typeof loginSchema>;

// Definição das relações entre as tabelas
export const usuariosRelations = relations(usuarios, ({ many, one }) => ({
  paciente: one(pacientes, {
    fields: [usuarios.id],
    references: [pacientes.usuarioId],
  }),
  psicologo: one(psicologos, {
    fields: [usuarios.id],
    references: [psicologos.usuarioId],
  }),
}));

export const pacientesRelations = relations(pacientes, ({ many, one }) => ({
  usuario: one(usuarios, {
    fields: [pacientes.usuarioId],
    references: [usuarios.id],
  }),
  prontuarios: many(prontuarios),
  agendamentos: many(agendamentos),
  planosVinculados: many(pacientesPlanosSaude),
  documentos: many(documentos),
}));

export const psicologosRelations = relations(psicologos, ({ many, one }) => ({
  usuario: one(usuarios, {
    fields: [psicologos.usuarioId],
    references: [usuarios.id],
  }),
  disponibilidades: many(disponibilidadePsicologos),
  bloqueios: many(bloqueiosHorarios),
  agendamentos: many(agendamentos),
  prontuarios: many(prontuarios),
  documentos: many(documentos),
}));

export const filiaisRelations = relations(filiais, ({ many }) => ({
  salas: many(salas),
  agendamentos: many(agendamentos),
}));

export const salasRelations = relations(salas, ({ many, one }) => ({
  filial: one(filiais, {
    fields: [salas.filialId],
    references: [filiais.id],
  }),
  agendamentos: many(agendamentos),
}));

export const disponibilidadePsicologosRelations = relations(disponibilidadePsicologos, ({ one }) => ({
  psicologo: one(psicologos, {
    fields: [disponibilidadePsicologos.psicologoId],
    references: [psicologos.id],
  }),
}));

export const bloqueiosHorariosRelations = relations(bloqueiosHorarios, ({ one }) => ({
  psicologo: one(psicologos, {
    fields: [bloqueiosHorarios.psicologoId],
    references: [psicologos.id],
  }),
}));

export const planosSaudeRelations = relations(planosSaude, ({ many }) => ({
  pacientesVinculados: many(pacientesPlanosSaude),
  agendamentos: many(agendamentos),
}));

export const pacientesPlanosSaudeRelations = relations(pacientesPlanosSaude, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [pacientesPlanosSaude.pacienteId],
    references: [pacientes.id],
  }),
  planoSaude: one(planosSaude, {
    fields: [pacientesPlanosSaude.planoSaudeId],
    references: [planosSaude.id],
  }),
}));

export const agendamentosRelations = relations(agendamentos, ({ one, many }) => ({
  paciente: one(pacientes, {
    fields: [agendamentos.pacienteId],
    references: [pacientes.id],
  }),
  psicologo: one(psicologos, {
    fields: [agendamentos.psicologoId],
    references: [psicologos.id],
  }),
  sala: one(salas, {
    fields: [agendamentos.salaId],
    references: [salas.id],
  }),
  filial: one(filiais, {
    fields: [agendamentos.filialId],
    references: [filiais.id],
  }),
  planoSaude: one(planosSaude, {
    fields: [agendamentos.planoSaudeId],
    references: [planosSaude.id],
  }),
  atendimentos: many(atendimentos),
}));

export const atendimentosRelations = relations(atendimentos, ({ one, many }) => ({
  agendamento: one(agendamentos, {
    fields: [atendimentos.agendamentoId],
    references: [agendamentos.id],
  }),
  pagamentos: many(pagamentos),
}));

export const pagamentosRelations = relations(pagamentos, ({ one }) => ({
  atendimento: one(atendimentos, {
    fields: [pagamentos.atendimentoId],
    references: [atendimentos.id],
  }),
}));

export const prontuariosRelations = relations(prontuarios, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [prontuarios.pacienteId],
    references: [pacientes.id],
  }),
  psicologo: one(psicologos, {
    fields: [prontuarios.psicologoId],
    references: [psicologos.id],
  }),
}));

export const documentosRelations = relations(documentos, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [documentos.pacienteId],
    references: [pacientes.id],
  }),
  psicologo: one(psicologos, {
    fields: [documentos.psicologoId],
    references: [psicologos.id],
  }),
}));

// Avaliações clínicas
export const avaliacoes = pgTable("avaliacoes", {
  id: serial("id").primaryKey(),
  pacienteId: integer("paciente_id").references(() => pacientes.id).notNull(),
  psicologoId: integer("psicologo_id").references(() => psicologos.id).notNull(),
  tipo: text("tipo").notNull(), // ansiedade, depressao, qualidade_vida
  respostas: json("respostas").notNull(),
  pontuacao: integer("pontuacao").notNull(),
  dataAvaliacao: timestamp("data_avaliacao").defaultNow(),
  observacoes: text("observacoes"),
});

export const avaliacoesRelations = relations(avaliacoes, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [avaliacoes.pacienteId],
    references: [pacientes.id],
  }),
  psicologo: one(psicologos, {
    fields: [avaliacoes.psicologoId],
    references: [psicologos.id],
  }),
}));

export const insertAvaliacaoSchema = createInsertSchema(avaliacoes).omit({ id: true });
export type InsertAvaliacao = z.infer<typeof insertAvaliacaoSchema>;
export type Avaliacao = typeof avaliacoes.$inferSelect;