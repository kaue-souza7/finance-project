import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """Envia o link de recuperação. Retorna False se o SMTP não estiver configurado."""
    if not settings.SMTP_HOST:
        logger.warning(
            "SMTP não configurado: e-mail de recuperação não enviado para %s",
            to_email,
        )
        if settings.DEBUG:
            logger.info("Link de recuperação (DEBUG): %s", reset_link)
        return False

    message = EmailMessage()
    message["Subject"] = "Redefinição de senha — Finance"
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email
    message.set_content(
        "Recebemos um pedido para redefinir sua senha.\n\n"
        f"Acesse o link abaixo (válido por {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutos):\n"
        f"{reset_link}\n\n"
        "Se você não fez esse pedido, ignore esta mensagem."
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except Exception:
        logger.exception("Falha ao enviar e-mail de recuperação para %s", to_email)
        return False

    return True


def send_additional_organization_invite_email(
    to_email: str,
    invite_link: str,
    owner_name: str,
    organization_title: str,
    expires_at: str,
) -> bool:
    """Envia o convite de Organização Adicional por e-mail."""
    if not settings.SMTP_HOST:
        logger.warning(
            "SMTP não configurado: convite de organização não enviado para %s",
            to_email,
        )
        if settings.DEBUG:
            logger.info("Link do convite (DEBUG): %s", invite_link)
        return False

    message = EmailMessage()
    message["Subject"] = "Convite para compartilhar uma organização — Finance"
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email
    message.set_content(
        f"Olá!\n\n"
        f"{owner_name} compartilhou a organização "
        f'"{organization_title}" com você no Finance.\n\n'
        f"Para aceitar o convite, acesse:\n"
        f"{invite_link}\n\n"
        f"O convite expira em {expires_at}.\n\n"
        f"Se você não esperava este convite, ignore esta mensagem."
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except Exception:
        logger.exception(
            "Falha ao enviar convite de organização para %s", to_email
        )
        return False

    return True
