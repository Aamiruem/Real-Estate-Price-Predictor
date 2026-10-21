from datetime import datetime

from pydantic import BaseModel


class PredictionResponse(BaseModel):

    property_id: int

    prediction_id: int

    predicted_price: float

    price_per_sqft: float

    min_price: float

    max_price: float

    model_version: str

    created_at: datetime