from pathlib import Path

import joblib
import pandas as pd


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(
    __file__
).resolve().parents[1]


MODEL_PATH = (
    BASE_DIR
    / "model"
    / "model.pkl"
)


# =========================================================
# MODEL VERSION
# =========================================================

MODEL_VERSION = "random-forest-v1"


# =========================================================
# FEATURE COLUMNS
# =========================================================

FEATURE_COLUMNS = [

    "location",

    "locality",

    "property_type",

    "area",

    "bedrooms",

    "bathrooms",

    "floor",

    "total_floors",

    "property_age",

    "parking",

    "lift",

    "furnishing",

    "facing",

    "balcony",

    "amenities",

    "amenities_count",

    "gated_community",

    "security",

    "power_backup",

    "water_supply",

    "property_status",

    "metro_distance",

    "school_distance",

    "hospital_distance",

    "main_road_distance",
]


# =========================================================
# LOAD MODEL
# =========================================================

def load_model():

    if not MODEL_PATH.exists():

        raise FileNotFoundError(

            f"Model file not found: {MODEL_PATH}. "

            "Please run train_model.py first."

        )

    return joblib.load(
        MODEL_PATH
    )


# =========================================================
# PREDICT PRICE
# =========================================================

def predict_price(
    property_data: dict,
) -> float:

    # Load trained model
    model = load_model()

    # -----------------------------------------------------
    # Create one-row dictionary
    # -----------------------------------------------------

    row = {}

    for column in FEATURE_COLUMNS:

        row[column] = property_data.get(
            column
        )

    # -----------------------------------------------------
    # Convert dictionary to DataFrame
    # -----------------------------------------------------

    df = pd.DataFrame(
        [row],
        columns=FEATURE_COLUMNS,
    )

    # -----------------------------------------------------
    # Prediction
    # -----------------------------------------------------

    prediction = model.predict(
        df
    )[0]

    prediction = float(
        prediction
    )

    # Prevent negative price
    return max(
        prediction,
        0.0,
    )