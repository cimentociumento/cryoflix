import nodemailer from 'nodemailer';
import { env } from '../../config/environment';
import { logger } from '../utils/logger';

export class EmailService {
  private createTransport() {
    if (!env.smtp.host || !env.smtp.user) {
      return null;
    }
    return nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${env.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    if (env.nodeEnv !== 'production' && !env.smtp.host) {
      logger.info({ to, link }, 'E-mail de verificação (SMTP não configurado)');
      return;
    }
    const transport = this.createTransport();
    if (!transport) {
      logger.info({ to, link }, 'E-mail de verificação (sem transport SMTP)');
      return;
    }
    await transport.sendMail({
      from: env.smtp.user,
      to,
      subject: 'Verifique seu e-mail — CryoFlix',
      text: `Acesse o link para verificar: ${link}`,
      html: `<p>Acesse o link para verificar sua conta:</p><p><a href="${link}">${link}</a></p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    if (env.nodeEnv !== 'production' && !env.smtp.host) {
      logger.info({ to, link }, 'E-mail de reset de senha (SMTP não configurado)');
      return;
    }
    const transport = this.createTransport();
    if (!transport) {
      logger.info({ to, link }, 'E-mail de reset (sem transport SMTP)');
      return;
    }
    await transport.sendMail({
      from: env.smtp.user,
      to,
      subject: 'Redefinição de senha — CryoFlix',
      text: `Redefina sua senha: ${link}`,
      html: `<p>Redefina sua senha:</p><p><a href="${link}">${link}</a></p>`,
    });
  }
}
