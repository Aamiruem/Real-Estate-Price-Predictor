from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Property

from schemas.property import PropertyResponse


router = APIRouter(
    prefix="/properties",
    tags=["Properties"],
)


# =========================================================
# GET ALL PROPERTIES
# =========================================================

@router.get(
    "",
    response_model=list[PropertyResponse],
)
def get_properties(
    db: Session = Depends(get_db),
):

    properties = (
        db.query(Property)
        .order_by(Property.created_at.desc())
        .all()
    )

    return properties


# =========================================================
# GET PROPERTY BY ID
# =========================================================

@router.get(
    "/{property_id}",
    response_model=PropertyResponse,
)
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
):

    property_record = (
        db.query(Property)
        .filter(Property.id == property_id)
        .first()
    )

    if not property_record:

        raise HTTPException(
            status_code=404,
            detail="Property not found",
        )

    return property_record