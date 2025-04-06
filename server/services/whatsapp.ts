
import axios from 'axios';

export class WhatsAppService {
  private apiUrl: string;
  private accessToken: string;

  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v17.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  async sendMessage(to: string, message: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(to: string, appointmentDetails: any) {
    const message = `Lembrete: Você tem uma consulta agendada para ${appointmentDetails.data} às ${appointmentDetails.horaInicio}. Por favor, confirme sua presença.`;
    return this.sendMessage(to, message);
  }
}

export const whatsappService = new WhatsAppService();
