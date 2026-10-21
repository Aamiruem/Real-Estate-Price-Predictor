import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
TRAINING_ENV = BASE_DIR / ".venv312"

if Path(sys.prefix).resolve() != TRAINING_ENV.resolve():
    raise SystemExit(
        "Use the project Python 3.12 environment to train the model. "
        "In PowerShell run: "
        ".\\.venv312\\Scripts\\Activate.ps1; python train_model.py"
    )


import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "property_data.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "model.pkl"
)

FEATURE_PATH = os.path.join(
    MODEL_DIR,
    "feature_importance.json"
)

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# ESTATEAI FEATURE SCHEMA
# ============================================================

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
    "main_road_distance"
]

TARGET_COLUMN = "price"


# ============================================================
# NUMERIC FEATURES
# ============================================================

NUMERIC_COLUMNS = [
    "area",
    "bedrooms",
    "bathrooms",
    "floor",
    "total_floors",
    "property_age",
    "parking",
    "balcony",
    "amenities_count",
    "metro_distance",
    "school_distance",
    "hospital_distance",
    "main_road_distance"
]


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

CATEGORICAL_COLUMNS = [
    "location",
    "locality",
    "property_type",
    "lift",
    "furnishing",
    "facing",
    "amenities",
    "gated_community",
    "security",
    "power_backup",
    "water_supply",
    "property_status"
]


# ============================================================
# LOAD DATASET
# ============================================================

print("=" * 60)
print("ESTATEAI MODEL TRAINING")
print("=" * 60)

print("\nLoading dataset...")

if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"CSV file not found:\n{DATA_PATH}"
    )

df = pd.read_csv(DATA_PATH)

print("\nOriginal shape:", df.shape)

print("\nOriginal columns:")
print(df.columns.tolist())


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

REQUIRED_COLUMNS = FEATURE_COLUMNS + [TARGET_COLUMN]

missing_columns = [
    column
    for column in REQUIRED_COLUMNS
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        "\nMissing columns in CSV:\n"
        f"{missing_columns}\n\n"
        "Expected columns:\n"
        f"{REQUIRED_COLUMNS}\n\n"
        "Current columns:\n"
        f"{df.columns.tolist()}"
    )

print("\nAll required columns are present.")


# ============================================================
# KEEP ONLY ESTATEAI COLUMNS
# ============================================================

df = df[REQUIRED_COLUMNS].copy()


# ============================================================
# DUPLICATE REMOVAL
# ============================================================

duplicate_count = df.duplicated().sum()

print("\nDuplicate rows:", duplicate_count)

if duplicate_count > 0:
    df = df.drop_duplicates()

print(
    "Shape after duplicate removal:",
    df.shape
)


# ============================================================
# CLEAN NUMERIC COLUMNS
# ============================================================

for column in NUMERIC_COLUMNS + [TARGET_COLUMN]:

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# CLEAN CATEGORICAL COLUMNS
# ============================================================

for column in CATEGORICAL_COLUMNS:

    df[column] = (
        df[column]
        .fillna("Unknown")
        .astype(str)
        .str.strip()
    )


# ============================================================
# REMOVE ROWS WITHOUT PRICE
# ============================================================

missing_target = df[TARGET_COLUMN].isna().sum()

print(
    "\nRows with missing price:",
    missing_target
)

df = df.dropna(
    subset=[TARGET_COLUMN]
)


# ============================================================
# FILL NUMERIC MISSING VALUES
# ============================================================

print("\nMissing numeric values before cleaning:")

print(
    df[NUMERIC_COLUMNS].isnull().sum()
)

for column in NUMERIC_COLUMNS:

    median_value = df[column].median()

    if pd.isna(median_value):
        median_value = 0

    df[column] = df[column].fillna(
        median_value
    )


# ============================================================
# BASIC NUMERIC VALIDATION
# ============================================================

df["area"] = df["area"].clip(
    lower=1
)

df["bedrooms"] = df["bedrooms"].clip(
    lower=0
)

df["bathrooms"] = df["bathrooms"].clip(
    lower=0
)

df["floor"] = df["floor"].clip(
    lower=0
)

df["total_floors"] = df["total_floors"].clip(
    lower=1
)

df["property_age"] = df["property_age"].clip(
    lower=0
)

df["parking"] = df["parking"].clip(
    lower=0
)

df["balcony"] = df["balcony"].clip(
    lower=0
)

df["amenities_count"] = df["amenities_count"].clip(
    lower=0
)

df["metro_distance"] = df["metro_distance"].clip(
    lower=0
)

df["school_distance"] = df["school_distance"].clip(
    lower=0
)

df["hospital_distance"] = df["hospital_distance"].clip(
    lower=0
)

df["main_road_distance"] = df["main_road_distance"].clip(
    lower=0
)


# ============================================================
# FINAL DATASET INFORMATION
# ============================================================

print("\n" + "=" * 60)
print("FINAL DATASET")
print("=" * 60)

print("\nFinal shape:")
print(df.shape)

print("\nFinal columns:")
print(df.columns.tolist())

print("\nRemaining missing values:")

print(
    df[REQUIRED_COLUMNS]
    .isnull()
    .sum()
)


# ============================================================
# X AND Y
# ============================================================

X = df[FEATURE_COLUMNS]

y = df[TARGET_COLUMN]


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("\n" + "=" * 60)
print("TRAIN / TEST SPLIT")
print("=" * 60)

print(
    "Training rows:",
    len(X_train)
)

print(
    "Testing rows:",
    len(X_test)
)


# ============================================================
# NUMERIC PIPELINE
# ============================================================

numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="median"
            )
        )
    ]
)


# ============================================================
# CATEGORICAL PIPELINE
# ============================================================

categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="most_frequent"
            )
        ),

        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)


# ============================================================
# PREPROCESSOR
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_pipeline,
            NUMERIC_COLUMNS
        ),

        (
            "categorical",
            categorical_pipeline,
            CATEGORICAL_COLUMNS
        )
    ]
)


# ============================================================
# RANDOM FOREST
# ============================================================

random_forest = RandomForestRegressor(
    n_estimators=300,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=42,
    n_jobs=-1
)


# ============================================================
# COMPLETE PIPELINE
# ============================================================

pipeline = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),

        (
            "model",
            random_forest
        )
    ]
)


# ============================================================
# TRAIN MODEL
# ============================================================

print("\n" + "=" * 60)
print("TRAINING MODEL")
print("=" * 60)

print("\nTraining Random Forest...")

pipeline.fit(
    X_train,
    y_train
)

print("Training completed successfully.")


# ============================================================
# PREDICTIONS
# ============================================================

predictions = pipeline.predict(
    X_test
)


# ============================================================
# MODEL EVALUATION
# ============================================================

mae = mean_absolute_error(
    y_test,
    predictions
)

mse = mean_squared_error(
    y_test,
    predictions
)

rmse = np.sqrt(mse)

r2 = r2_score(
    y_test,
    predictions
)


print("\n" + "=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(
    f"MAE  : INR {mae:,.2f}"
)

print(
    f"RMSE : INR {rmse:,.2f}"
)

print(
    f"R2   : {r2:.4f}"
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print("\nCalculating feature importance...")

trained_preprocessor = (
    pipeline.named_steps["preprocessor"]
)

trained_model = (
    pipeline.named_steps["model"]
)

feature_names = (
    trained_preprocessor
    .get_feature_names_out()
)

importances = (
    trained_model.feature_importances_
)

feature_df = pd.DataFrame(
    {
        "feature": feature_names,
        "importance": importances
    }
)

feature_df = feature_df.sort_values(
    by="importance",
    ascending=False
)

print("\nTop 20 features:")

print(
    feature_df.head(20)
)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(
    pipeline,
    MODEL_PATH
)

print("\nModel saved successfully:")

print(
    MODEL_PATH
)


# ============================================================
# SAVE FEATURE IMPORTANCE
# ============================================================

top_features = []

for _, row in feature_df.head(20).iterrows():

    top_features.append(
        {
            "feature": str(
                row["feature"]
            ),

            "importance": round(
                float(
                    row["importance"]
                ),
                6
            )
        }
    )


with open(
    FEATURE_PATH,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        top_features,
        file,
        indent=4
    )


print(
    "\nFeature importance saved:"
)

print(
    FEATURE_PATH
)


# ============================================================
# TEST SAMPLE PREDICTION
# ============================================================

print("\n" + "=" * 60)
print("TEST SAMPLE PREDICTION")
print("=" * 60)

sample_property = X_test.iloc[[0]]

sample_actual = y_test.iloc[0]

sample_prediction = pipeline.predict(
    sample_property
)[0]

print(
    "\nActual price:",
    f"INR {sample_actual:,.2f}"
)

print(
    "Predicted price:",
    f"INR {sample_prediction:,.2f}"
)


# ============================================================
# FINISHED
# ============================================================

print("\n" + "=" * 60)
print("TRAINING FINISHED SUCCESSFULLY")
print("=" * 60)
