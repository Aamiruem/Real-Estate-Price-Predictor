from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Prediction, Property

from schemas.prediction import PredictionResponse
from schemas.property import PropertyCreate

from services.ml_service import (
    MODEL_VERSION,
    predict_price,
)


router = APIRouter(
    prefix="/predict",
    tags=["Predictions"],
)


# =========================================================
# CREATE PREDICTION
# =========================================================

@router.post(
    "",
    response_model=PredictionResponse,
)
def create_prediction(
    data: PropertyCreate,
    db: Session = Depends(get_db),
):

    try:

        # -------------------------------------------------
        # STEP 1: Save property information
        # -------------------------------------------------

        property_record = Property(
            **data.model_dump()
        )

        db.add(property_record)

        db.commit()

        db.refresh(property_record)

        # -------------------------------------------------
        # STEP 2: Run ML prediction
        # -------------------------------------------------

        predicted_price = predict_price(
            data.model_dump()
        )

        # -------------------------------------------------
        # STEP 3: Calculate price per square foot
        # -------------------------------------------------

        if data.area > 0:

            price_per_sqft = (
                predicted_price / data.area
            )

        else:

            price_per_sqft = 0

        # -------------------------------------------------
        # STEP 4: Calculate estimated range
        # -------------------------------------------------

        min_price = predicted_price * 0.90

        max_price = predicted_price * 1.10

        # -------------------------------------------------
        # STEP 5: Save prediction
        # -------------------------------------------------

        prediction_record = Prediction(

            property_id=property_record.id,

            predicted_price=predicted_price,

            price_per_sqft=price_per_sqft,

            min_price=min_price,

            max_price=max_price,

            model_version=MODEL_VERSION,
        )

        db.add(prediction_record)

        db.commit()

        db.refresh(prediction_record)

        # -------------------------------------------------
        # STEP 6: Return result
        # -------------------------------------------------

        return {

            "property_id": property_record.id,

            "prediction_id": prediction_record.id,

            "predicted_price": predicted_price,

            "price_per_sqft": price_per_sqft,

            "min_price": min_price,

            "max_price": max_price,

            "model_version": MODEL_VERSION,

            "created_at": prediction_record.created_at,
        }

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(exc)}",
        )


# =========================================================
# GET PREDICTION HISTORY
# =========================================================

@router.get(
    "/history"
)
def get_prediction_history(
    db: Session = Depends(get_db),
):

    predictions = (
        db.query(Prediction)
        .order_by(
            Prediction.created_at.desc()
        )
        .all()
    )

    return [

        {
            "prediction_id": prediction.id,

            "property_id": prediction.property_id,

            "predicted_price": prediction.predicted_price,

            "price_per_sqft": prediction.price_per_sqft,

            "min_price": prediction.min_price,

            "max_price": prediction.max_price,

            "model_version": prediction.model_version,

            "created_at": prediction.created_at,
        }

        for prediction in predictions

    ]