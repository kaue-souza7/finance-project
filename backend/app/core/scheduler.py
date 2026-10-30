import logging

logger = logging.getLogger(__name__)

_scheduler = None


def init_scheduler():
    global _scheduler

    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from app.database.session import SessionLocal
        from app.repositories.message_repository import MessageRepository
    except ImportError:
        logger.warning(
            "APScheduler não disponível — cleanup de mensagens desativado"
        )
        return

    def cleanup_expired_messages():
        db = SessionLocal()
        try:
            repo = MessageRepository()
            count = repo.delete_expired(db)
            if count > 0:
                logger.info("Cleanup: %d mensagens expiradas removidas", count)
            else:
                logger.debug("Cleanup: nenhuma mensagem expirada encontrada")
        except Exception:
            logger.exception("Erro ao limpar mensagens expiradas")
        finally:
            db.close()

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        cleanup_expired_messages,
        trigger="cron",
        hour=3,
        minute=0,
        id="chat_cleanup_daily",
        replace_existing=True,
    )

    def cleanup_expired_challenges():
        db = SessionLocal()
        try:
            from app.repositories.webauthn_repository import (
                WebAuthnChallengeRepository,
            )
            repo = WebAuthnChallengeRepository()
            count = repo.delete_expired(db)
            if count > 0:
                logger.info("Cleanup: %d challenges expirados removidos", count)
        except Exception:
            logger.exception("Erro ao limpar challenges expirados")
        finally:
            db.close()

    _scheduler.add_job(
        cleanup_expired_challenges,
        trigger="cron",
        hour=3,
        minute=30,
        id="webauthn_challenge_cleanup_daily",
        replace_existing=True,
    )

    def cleanup_expired_auth_tokens():
        db = SessionLocal()
        try:
            from app.repositories.password_reset_token_repository import (
                PasswordResetTokenRepository,
            )
            from app.repositories.refresh_token_repository import (
                RefreshTokenRepository,
            )
            refresh_count = RefreshTokenRepository.delete_expired(db)
            reset_count = PasswordResetTokenRepository.delete_expired(db)
            db.commit()
            if refresh_count or reset_count:
                logger.info(
                    "Cleanup: %d refresh tokens e %d reset tokens expirados removidos",
                    refresh_count,
                    reset_count,
                )
        except Exception:
            db.rollback()
            logger.exception("Erro ao limpar tokens de autenticação expirados")
        finally:
            db.close()

    _scheduler.add_job(
        cleanup_expired_auth_tokens,
        trigger="cron",
        hour=3,
        minute=45,
        id="auth_token_cleanup_daily",
        replace_existing=True,
    )

    _scheduler.start()

    logger.info("Scheduler de limpeza iniciado (diário às 03:00 UTC)")


def shutdown_scheduler():
    global _scheduler

    if _scheduler is None:
        return

    try:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler finalizado")
    except Exception:
        logger.exception("Erro ao finalizar scheduler")
    finally:
        _scheduler = None
