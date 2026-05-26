from decimal import Decimal

from pydantic import BaseModel


class MonthlyInvestment(BaseModel):
    month: int
    year: int
    label: str
    invested: Decimal


class InvestmentSummaryResponse(BaseModel):
    total_invested: Decimal
    total_months: int
    average_monthly: Decimal
    best_month: MonthlyInvestment | None
    monthly_breakdown: list[MonthlyInvestment]
