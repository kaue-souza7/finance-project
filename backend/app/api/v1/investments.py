from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.investment import InvestmentSummaryResponse
from app.services.investment_service import InvestmentService

router = APIRouter(prefix="/investments", tags=["investments"])


@router.get("/summary", response_model=InvestmentSummaryResponse)
def get_investment_summary(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InvestmentService(db)
    return service.get_summary(str(current_user.id))
