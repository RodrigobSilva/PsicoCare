import nodemailer from 'nodemailer';
import { db } from '../db';
import * as schema from '@shared/schema';

// Interface para configurações de email
export interface EmailConfig {
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFrom: string;
  emailEnabled: boolean;
  notificarAgendamento: boolean;
  notificarCancelamento: boolean;
  notificarLembrete: boolean;
  notificarPagamento: boolean;
}

// Chave para armazenar as configurações no banco
const CONFIG_KEY = 'email_config';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig = {
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPassword: '',
    emailFrom: '',
    emailEnabled: false,
    notificarAgendamento: true,
    notificarCancelamento: true,
    notificarLembrete: true,
    notificarPagamento: true
  };
  
  constructor() {
    this.loadConfig();
  }
  
  // Carregar configurações do banco ou variáveis de ambiente
  async loadConfig() {
    try {
      // Usar variáveis de ambiente se disponíveis
      const host = process.env.EMAIL_HOST;
      const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587;
      const user = process.env.EMAIL_USER;
      const pass = process.env.EMAIL_PASSWORD;
      const from = process.env.EMAIL_FROM;
      
      if (host && user && pass && from) {
        this.config = {
          emailHost: host,
          emailPort: port,
          emailUser: user,
          emailPassword: pass,
          emailFrom: from,
          emailEnabled: true,
          notificarAgendamento: true,
          notificarCancelamento: true,
          notificarLembrete: true,
          notificarPagamento: true
        };
        this.initializeTransporter();
      }
      
      // Como não temos a tabela systemConfigs, vamos manter os dados em memória
      // Em uma implementação completa, seria necessário criar essa tabela no banco
    } catch (error) {
      console.error('Erro ao carregar configurações de email:', error);
    }
  }
  
  // Inicializar transporter com as configurações atuais
  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.emailHost,
        port: this.config.emailPort,
        secure: this.config.emailPort === 465, // true para 465, false para outras portas
        auth: {
          user: this.config.emailUser,
          pass: this.config.emailPassword,
        },
      });
    } catch (error) {
      console.error('Erro ao inicializar transporter de email:', error);
      this.transporter = null;
    }
  }
  
  // Salvar configurações (em memória)
  async saveConfig(config: EmailConfig) {
    try {
      // Atualizar configuração na memória
      this.config = config;
      
      // Em uma implementação completa, salvaríamos no banco
      // Como não temos a tabela, vamos apenas registrar no console
      console.log('Configurações de email salvas:', JSON.stringify(config));
      
      // Reinicializar o transporter se necessário
      if (config.emailEnabled) {
        this.initializeTransporter();
      } else {
        this.transporter = null;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações de email:', error);
      throw error;
    }
  }
  
  // Obter configuração atual
  async getConfig(): Promise<EmailConfig> {
    // Recarregar configurações
    await this.loadConfig();
    return this.config;
  }
  
  // Verificar se o serviço está configurado e habilitado
  isEnabled(): boolean {
    return this.config.emailEnabled && this.transporter !== null;
  }
  
  // Enviar email
  async sendEmail(to: string, subject: string, html: string) {
    if (!this.isEnabled()) {
      console.log('Serviço de email não está habilitado');
      throw new Error('Serviço de email não está habilitado');
    }
    
    try {
      const mailOptions = {
        from: this.config.emailFrom,
        to,
        subject,
        html,
      };
      
      const info = await this.transporter!.sendMail(mailOptions);
      console.log('Email enviado:', info.messageId);
      return info;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }
  
  // Enviar email de teste
  async sendTestEmail() {
    // Força inicialização do transporter com as configurações atuais
    this.initializeTransporter();
    
    return this.sendEmail(
      this.config.emailUser,
      'Teste de Configuração de Email',
      `
        <h1>Teste de Configuração de Email</h1>
        <p>Este é um email de teste enviado para verificar a configuração de email do sistema da clínica.</p>
        <p>Se você está recebendo este email, a configuração está funcionando corretamente.</p>
        <p>Configurações atuais:</p>
        <ul>
          <li>Servidor: ${this.config.emailHost}</li>
          <li>Porta: ${this.config.emailPort}</li>
          <li>Usuário: ${this.config.emailUser}</li>
          <li>Remetente: ${this.config.emailFrom}</li>
          <li>Notificações:</li>
          <ul>
            <li>Agendamentos: ${this.config.notificarAgendamento ? 'Ativado' : 'Desativado'}</li>
            <li>Cancelamentos: ${this.config.notificarCancelamento ? 'Ativado' : 'Desativado'}</li>
            <li>Lembretes: ${this.config.notificarLembrete ? 'Ativado' : 'Desativado'}</li>
            <li>Pagamentos: ${this.config.notificarPagamento ? 'Ativado' : 'Desativado'}</li>
          </ul>
        </ul>
        <p>Data e hora do teste: ${new Date().toLocaleString('pt-BR')}</p>
      `
    );
  }
  
  // Enviar email de notificação de agendamento
  async sendAppointmentNotification(email: string, appointmentDetails: any) {
    if (!this.isEnabled() || !this.config.notificarAgendamento) {
      return;
    }
    
    try {
      const pacienteNome = appointmentDetails.paciente?.usuario?.nome || 'Paciente';
      const psicologoNome = appointmentDetails.psicologo?.usuario?.nome || 'Terapeuta';
      const data = appointmentDetails.data || 'Data não definida';
      const horaInicio = appointmentDetails.horaInicio || 'Horário não definido';
      
      return this.sendEmail(
        email,
        'Confirmação de Agendamento - Clínica Psicológica',
        `
          <h1>Confirmação de Agendamento</h1>
          <p>Olá ${pacienteNome},</p>
          <p>Sua consulta foi agendada com sucesso!</p>
          <p><strong>Detalhes do Agendamento:</strong></p>
          <ul>
            <li><strong>Data:</strong> ${new Date(data).toLocaleDateString('pt-BR')}</li>
            <li><strong>Horário:</strong> ${horaInicio}</li>
            <li><strong>Profissional:</strong> ${psicologoNome}</li>
            <li><strong>Local:</strong> ${appointmentDetails.filial?.nome || 'Local não definido'}</li>
            <li><strong>Sala:</strong> ${appointmentDetails.sala?.nome || 'Sala não definida'}</li>
          </ul>
          <p>Em caso de dúvidas ou necessidade de cancelamento, entre em contato conosco.</p>
          <p>Atenciosamente,<br>Equipe da Clínica</p>
        `
      );
    } catch (error) {
      console.error('Erro ao enviar notificação de agendamento:', error);
      // Não lançar erro para não afetar o fluxo principal
    }
  }
  
  // Enviar email de cancelamento de agendamento
  async sendCancellationNotification(email: string, appointmentDetails: any) {
    if (!this.isEnabled() || !this.config.notificarCancelamento) {
      return;
    }
    
    try {
      const pacienteNome = appointmentDetails.paciente?.usuario?.nome || 'Paciente';
      const data = appointmentDetails.data || 'Data não definida';
      const horaInicio = appointmentDetails.horaInicio || 'Horário não definido';
      
      return this.sendEmail(
        email,
        'Cancelamento de Agendamento - Clínica Psicológica',
        `
          <h1>Cancelamento de Agendamento</h1>
          <p>Olá ${pacienteNome},</p>
          <p>Informamos que o agendamento para a data ${new Date(data).toLocaleDateString('pt-BR')} às ${horaInicio} foi cancelado.</p>
          <p>Para reagendar, entre em contato conosco ou acesse nosso sistema online.</p>
          <p>Atenciosamente,<br>Equipe da Clínica</p>
        `
      );
    } catch (error) {
      console.error('Erro ao enviar notificação de cancelamento:', error);
      // Não lançar erro para não afetar o fluxo principal
    }
  }
  
  // Enviar email de lembrete de consulta
  async sendReminderNotification(email: string, appointmentDetails: any) {
    if (!this.isEnabled() || !this.config.notificarLembrete) {
      return;
    }
    
    try {
      const pacienteNome = appointmentDetails.paciente?.usuario?.nome || 'Paciente';
      const psicologoNome = appointmentDetails.psicologo?.usuario?.nome || 'Terapeuta';
      const data = appointmentDetails.data || 'Data não definida';
      const horaInicio = appointmentDetails.horaInicio || 'Horário não definido';
      
      return this.sendEmail(
        email,
        'Lembrete de Consulta - Clínica Psicológica',
        `
          <h1>Lembrete de Consulta</h1>
          <p>Olá ${pacienteNome},</p>
          <p>Gostaríamos de lembrá-lo(a) da sua consulta agendada para amanhã.</p>
          <p><strong>Detalhes do Agendamento:</strong></p>
          <ul>
            <li><strong>Data:</strong> ${new Date(data).toLocaleDateString('pt-BR')}</li>
            <li><strong>Horário:</strong> ${horaInicio}</li>
            <li><strong>Profissional:</strong> ${psicologoNome}</li>
            <li><strong>Local:</strong> ${appointmentDetails.filial?.nome || 'Local não definido'}</li>
            <li><strong>Sala:</strong> ${appointmentDetails.sala?.nome || 'Sala não definida'}</li>
          </ul>
          <p>Por favor, chegue com 10 minutos de antecedência. Em caso de imprevistos, entre em contato conosco o quanto antes.</p>
          <p>Atenciosamente,<br>Equipe da Clínica</p>
        `
      );
    } catch (error) {
      console.error('Erro ao enviar lembrete de consulta:', error);
      // Não lançar erro para não afetar o fluxo principal
    }
  }
  
  // Enviar comprovante de pagamento
  async sendPaymentReceipt(email: string, paymentDetails: any) {
    if (!this.isEnabled() || !this.config.notificarPagamento) {
      return;
    }
    
    try {
      const pacienteNome = paymentDetails.paciente?.usuario?.nome || 'Paciente';
      const valor = paymentDetails.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Valor não definido';
      const data = paymentDetails.data || new Date().toISOString();
      const metodoPagamento = paymentDetails.metodoPagamento || 'Não especificado';
      
      return this.sendEmail(
        email,
        'Comprovante de Pagamento - Clínica Psicológica',
        `
          <h1>Comprovante de Pagamento</h1>
          <p>Olá ${pacienteNome},</p>
          <p>Confirmamos o recebimento do pagamento:</p>
          <p><strong>Detalhes do Pagamento:</strong></p>
          <ul>
            <li><strong>Valor:</strong> ${valor}</li>
            <li><strong>Data:</strong> ${new Date(data).toLocaleDateString('pt-BR')}</li>
            <li><strong>Método de Pagamento:</strong> ${metodoPagamento}</li>
            <li><strong>Descrição:</strong> ${paymentDetails.descricao || 'Serviços de atendimento psicológico'}</li>
          </ul>
          <p>Este email serve como comprovante do pagamento realizado.</p>
          <p>Atenciosamente,<br>Equipe da Clínica</p>
        `
      );
    } catch (error) {
      console.error('Erro ao enviar comprovante de pagamento:', error);
      // Não lançar erro para não afetar o fluxo principal
    }
  }
}

// Exportar instância única do serviço
export const emailService = new EmailService();