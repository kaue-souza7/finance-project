import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.planning_repository import PlanningRepository
from app.schemas.investment import InvestmentSummaryResponse, MonthlyInvestment

MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro",
]


class InvestmentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PlanningRepository()

    def get_summary(self, user_id: str) -> InvestmentSummaryResponse:
        uid = uuid.UUID(user_id)
        plans = self.repo.list_by_user(self.db, uid)

        months = []
        for p in plans:
            invested = p.planned_investment
            if invested > 0:
                months.append(MonthlyInvestment(
                    month=p.month,
                    year=p.year,
                    label=f"{MONTH_NAMES[p.month - 1]}/{p.year}",
                    invested=invested,
                ))

        if not months:
            return InvestmentSummaryResponse(
                total_invested=Decimal("0.00"),
                total_months=0,
                average_monthly=Decimal("0.00"),
                best_month=None,
                monthly_breakdown=[],
            )

        months.sort(key=lambda m: (m.year, m.month))
        total = sum(m.invested for m in months)
        count = len(months)
        avg = total / Decimal(str(count))
        best = max(months, key=lambda m: m.invested)

        return InvestmentSummaryResponse(
            total_invested=total,
            total_months=count,
            average_monthly=avg,
            best_month=best,
            monthly_breakdown=months,
        )
