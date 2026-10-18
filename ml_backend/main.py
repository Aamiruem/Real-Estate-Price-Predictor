import os

import joblib
import pandas as pd

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    Response,
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field

from sqlalchemy.orm import Session

from database.database import (
    Base,
    engine,
    ensure_auth_columns,
    get_db,
)

from database.models import ContactEnquiry, User

from schemas.schemas import (
    ContactRequest,
    SignupRequest,
    LoginRequest,
)

from auth import (
    hash_password,
    verify_password,
    is_legacy_bcrypt_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from auth_dependencies import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    clear_auth_cookies,
    get_current_user,
    set_auth_cookies,
)
from jose import JWTError
from sqlalchemy.exc import IntegrityError


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="EstateIQ Property Valuation API",
    version="1.0.0",
    description="Machine Learning based property price prediction API",
)


# ============================================================
# CORS
# ============================================================

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGIN",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]
frontend_origins.extend(
    origin
    for origin in (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    )
    if origin not in frontend_origins
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Content-Type"],
)

# ============================================================
# DATABASE TABLE CREATION
# ============================================================

try:

    Base.metadata.create_all(
        bind=engine
    )
    ensure_auth_columns()

    print("=" * 70)
    print("DATABASE TABLES READY")
    print("=" * 70)

except Exception as error:

    print("=" * 70)
    print("DATABASE TABLE CREATION ERROR")
    print("=" * 70)
    print(repr(error))
    print("=" * 70)
    raise RuntimeError("Database schema setup failed; API startup aborted.") from error


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "model.pkl"
)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "data",
    "property_data.csv"
)


# ============================================================
# LOAD ML MODEL
# ============================================================

model = None

try:

    if not os.path.exists(MODEL_PATH):

        print("=" * 70)
        print("MODEL FILE NOT FOUND")
        print(MODEL_PATH)
        print("=" * 70)

    else:

        model = joblib.load(
            MODEL_PATH
        )

        print("=" * 70)
        print("ESTATEIQ MODEL LOADED SUCCESSFULLY")
        print("=" * 70)
        print("MODEL:")
        print(MODEL_PATH)
        print("=" * 70)

except Exception as error:

    print("=" * 70)
    print("MODEL LOADING ERROR")
    print("=" * 70)
    print(repr(error))
    print("=" * 70)

    model = None


# ============================================================
# FEATURE COLUMNS
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
    "main_road_distance",
]


# ============================================================
# PROPERTY REQUEST
# ============================================================

class PropertyData(BaseModel):

    location: str

    locality: str

    property_type: str

    area: float = Field(gt=0)

    bedrooms: float = Field(ge=0)

    bathrooms: float = Field(ge=0)

    floor: float = Field(default=0, ge=0)

    total_floors: float = Field(default=0, ge=0)

    property_age: float = Field(default=0, ge=0)

    parking: float = Field(default=0, ge=0)

    lift: str = "No"

    furnishing: str = "Unfurnished"

    facing: str = "North"

    balcony: float = Field(default=0, ge=0)

    amenities: str = ""

    amenities_count: float = Field(default=0, ge=0)

    gated_community: str = "No"

    security: str = "No"

    power_backup: str = "No"

    water_supply: str = "24x7"

    property_status: str = "Ready to Move"

    metro_distance: float = Field(default=0, ge=0)

    school_distance: float = Field(default=0, ge=0)

    hospital_distance: float = Field(default=0, ge=0)

    main_road_distance: float = Field(default=0, ge=0)


# ============================================================
# SIGNUP
# ============================================================

def user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
    }


@app.post("/auth/signup")
def signup(
    data: SignupRequest,
    response: Response,
    db: Session = Depends(get_db),
):

    try:

        # ----------------------------------------------------
        # PASSWORD CONFIRMATION
        # ----------------------------------------------------

        if data.password != data.confirm_password:

            raise HTTPException(
                status_code=400,
                detail="Passwords do not match",
            )


        # ----------------------------------------------------
        # CLEAN DATA
        # ----------------------------------------------------

        name = data.name.strip()

        email = data.email.lower().strip()

        phone = data.phone.strip()


        # ----------------------------------------------------
        # CHECK EMAIL
        # ----------------------------------------------------

        existing_email = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if existing_email:

            raise HTTPException(
                status_code=409,
                detail="Email already registered",
            )


        # ----------------------------------------------------
        # CHECK PHONE
        # ----------------------------------------------------

        existing_phone = (
            db.query(User)
            .filter(
                User.phone == phone
            )
            .first()
        )

        if existing_phone:

            raise HTTPException(
                status_code=409,
                detail="Phone number already registered",
            )


        # ----------------------------------------------------
        # HASH PASSWORD
        # ----------------------------------------------------

        password_hash = hash_password(
            data.password
        )


        # ----------------------------------------------------
        # CREATE USER
        # ----------------------------------------------------

        user = User(

            name=name,

            email=email,

            phone=phone,

            password_hash=password_hash,

            is_active=True,

            is_verified=True,

            verification_token=None,

        )


        # ----------------------------------------------------
        # SAVE USER
        # ----------------------------------------------------

        db.add(user)

        db.commit()

        db.refresh(user)


        set_auth_cookies(
            response,
            create_access_token(user.id),
            create_refresh_token(user.id),
        )

        return {
            "success": True,
            "message": "Account created successfully.",
            "user": user_payload(user),
        }


    except HTTPException:

        raise


    except IntegrityError as error:

        db.rollback()

        # Only unique violations (SQLSTATE 23505) mean a duplicate account;
        # anything else (e.g. NOT NULL) is a server-side schema problem.
        if getattr(error.orig, "sqlstate", None) == "23505" or getattr(
            error.orig, "pgcode", None
        ) == "23505":
            raise HTTPException(
                status_code=409,
                detail="Email or phone number is already registered",
            )

        print("SIGNUP INTEGRITY ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Unable to create account."
        )


    except Exception as error:

        db.rollback()

        print("=" * 70)
        print("SIGNUP ERROR")
        print("=" * 70)
        print(repr(error))
        print("=" * 70)

        raise HTTPException(
            status_code=500,
            detail="Unable to create account."
        )



# ============================================================
# LOGIN
# ============================================================

@app.post("/auth/login")
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):

    try:

        email = data.email.lower().strip()


        # ----------------------------------------------------
        # FIND USER
        # ----------------------------------------------------

        user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )


        # ----------------------------------------------------
        # PASSWORD
        # ----------------------------------------------------

        if not verify_password(
            data.password,
            user.password_hash,
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        # ----------------------------------------------------
        # ACTIVE
        # ----------------------------------------------------

        if not user.is_active:

            raise HTTPException(
                status_code=403,
                detail="Account is inactive.",
            )


        if is_legacy_bcrypt_hash(user.password_hash):
            user.password_hash = hash_password(data.password)
            db.commit()


        # ----------------------------------------------------
        # SESSION COOKIES
        # ----------------------------------------------------

        set_auth_cookies(
            response,
            create_access_token(user.id),
            create_refresh_token(user.id),
        )

        return {
            "success": True,
            "message": "Login successful",
            "user": user_payload(user),
        }


    except HTTPException:

        raise


    except Exception as error:

        print("=" * 70)
        print("LOGIN ERROR")
        print("=" * 70)
        print(repr(error))
        print("=" * 70)

        raise HTTPException(
            status_code=500,
            detail="Login failed."
        )


@app.get("/auth/me")
def current_session(
    current_user: User = Depends(get_current_user),
):
    return {
        "message": "Authenticated",
        "user": user_payload(current_user),
    }


@app.post("/auth/refresh")
def refresh_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Refresh session not found",
        )

    try:
        user_id = decode_token(token, "refresh")
    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh session",
        )

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User account is not active",
        )

    set_auth_cookies(
        response,
        create_access_token(user.id),
        create_refresh_token(user.id),
    )
    return {
        "message": "Session refreshed",
        "user": user_payload(user),
    }


@app.post("/auth/logout")
def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@app.get("/users/me")
def current_profile(
    current_user: User = Depends(get_current_user),
):
    return user_payload(current_user)


# ============================================================
# CONTACT ENQUIRY
# ============================================================

@app.post("/contact", status_code=201)
def create_contact_enquiry(
    data: ContactRequest,
    db: Session = Depends(get_db),
):
    phone = (data.phone or "").strip() or None

    enquiry = ContactEnquiry(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        phone=phone,
        enquiry_type=data.enquiry_type,
        message=data.message.strip(),
    )

    try:
        db.add(enquiry)
        db.commit()
        db.refresh(enquiry)
    except Exception as error:
        db.rollback()
        print("CONTACT ENQUIRY ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Unable to save your enquiry. Please try again.",
        )

    return {
        "success": True,
        "message": "Your enquiry has been received.",
        "enquiry_id": enquiry.id,
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "success": True,

        "message": "EstateIQ API is running",

        "model_loaded": model is not None,

        "model_path": MODEL_PATH,

        "feature_count": len(
            FEATURE_COLUMNS
        ),

        "endpoints": {

            "health": "/health",

            "predict": "/predict",

            "feature_importance":
                "/feature-importance",

            "prediction_options":
                "/prediction-options",

            "signup":
                "/auth/signup",

            "login":
                "/auth/login",

            "current_user":
                "/auth/me",

            "refresh":
                "/auth/refresh",

            "logout":
                "/auth/logout",

            "docs":
                "/docs",

        },

    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {

        "success": True,

        "status": "healthy",

        "model_loaded": model is not None,

    }


# ============================================================
# PREDICTION OPTIONS
# ============================================================

def get_model_category_options():

    preprocessor = model.named_steps["preprocessor"]
    categorical_columns = next(
        columns
        for name, _, columns in preprocessor.transformers_
        if name == "categorical"
    )
    encoder = (
        preprocessor
        .named_transformers_["categorical"]
        .named_steps["onehot"]
    )

    return {
        column: sorted(
            str(value)
            for value in categories
        )
        for column, categories in zip(
            categorical_columns,
            encoder.categories_,
            strict=True,
        )
    }


@app.get("/prediction-options")
def prediction_options():

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ML model is not loaded."
        )

    if not os.path.exists(DATASET_PATH):
        raise HTTPException(
            status_code=503,
            detail="Training data is unavailable for prediction options."
        )

    try:
        options = get_model_category_options()

        location_data = pd.read_csv(
            DATASET_PATH,
            usecols=["location", "locality"]
        )
        localities_by_location = {
            str(location): sorted(
                group["locality"]
                .dropna()
                .astype(str)
                .unique()
                .tolist()
            )
            for location, group in location_data.groupby("location")
        }

    except (KeyError, StopIteration, TypeError, ValueError) as error:
        print("PREDICTION OPTIONS ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Unable to read prediction options from the trained model."
        ) from error

    return {
        "success": True,
        "options": options,
        "localities_by_location": localities_by_location,
    }


# ============================================================
# MARKET INSIGHT (live preview + AI auto-fill)
# ============================================================

# Optional form fields the frontend can auto-fill with typical values.
AUTOFILL_FIELDS = [
    "bathrooms", "floor", "total_floors", "property_age", "parking",
    "balcony", "lift", "furnishing", "facing", "amenities",
    "gated_community", "security", "power_backup", "water_supply",
    "property_status", "metro_distance", "school_distance",
    "hospital_distance", "main_road_distance",
]

_dataset_cache = None


def load_dataset() -> pd.DataFrame:
    global _dataset_cache
    if _dataset_cache is None:
        frame = pd.read_csv(DATASET_PATH)
        frame["price_per_sqft"] = frame["price"] / frame["area"]
        _dataset_cache = frame
    return _dataset_cache


def typical_value(series: pd.Series):
    if pd.api.types.is_numeric_dtype(series):
        value = float(series.median())
        # Distances keep one decimal; counts are whole numbers.
        return round(value, 1) if series.name.endswith("_distance") else int(round(value))
    return str(series.mode().iloc[0])


@app.get("/market-insight")
def market_insight(
    location: str | None = None,
    locality: str | None = None,
    property_type: str | None = None,
    bedrooms: int | None = None,
):
    if not os.path.exists(DATASET_PATH):
        raise HTTPException(status_code=503, detail="Training data is unavailable.")

    frame = load_dataset()

    def segment(use_locality=True, use_type=True, use_bedrooms=True):
        rows = frame
        if locality and use_locality:
            rows = rows[rows["locality"] == locality]
        elif location:
            rows = rows[rows["location"] == location]
        if property_type and use_type:
            rows = rows[rows["property_type"] == property_type]
        if bedrooms and use_bedrooms:
            rows = rows[rows["bedrooms"] == bedrooms]
        return rows

    # Widen the segment until it holds enough records to be meaningful.
    rows, widened = segment(), []
    steps = (
        ("bedrooms", {"use_bedrooms": False}),
        ("property type", {"use_bedrooms": False, "use_type": False}),
        ("locality", {"use_bedrooms": False, "use_type": False, "use_locality": False}),
    )
    for label, options in steps:
        if len(rows) >= 5:
            break
        rows = segment(**options)
        widened.append(label)

    if rows.empty:
        rows, widened = frame, ["all filters"]

    return {
        "success": True,
        "count": int(len(rows)),
        "widened": widened,
        "median_price": float(rows["price"].median()),
        "p25_price": float(rows["price"].quantile(0.25)),
        "p75_price": float(rows["price"].quantile(0.75)),
        "median_price_per_sqft": float(rows["price_per_sqft"].median()),
        "median_area": float(rows["area"].median()),
        "typical": {field: typical_value(rows[field]) for field in AUTOFILL_FIELDS},
    }


# ============================================================
# DEBUG
# ============================================================

@app.get("/debug")
def debug():

    return {

        "success": True,

        "main_file":
            os.path.abspath(__file__),

        "model_path":
            MODEL_PATH,

        "model_exists":
            os.path.exists(MODEL_PATH),

        "model_loaded":
            model is not None,

        "feature_count":
            len(FEATURE_COLUMNS),

        "features":
            FEATURE_COLUMNS,

    }


# ============================================================
# PREPARE MODEL INPUT
# ============================================================

def prepare_input(
    data: PropertyData
):

    input_data = {

        "location":
            data.location,

        "locality":
            data.locality,

        "property_type":
            data.property_type,

        "area":
            data.area,

        "bedrooms":
            data.bedrooms,

        "bathrooms":
            data.bathrooms,

        "floor":
            data.floor,

        "total_floors":
            data.total_floors,

        "property_age":
            data.property_age,

        "parking":
            data.parking,

        "lift":
            data.lift,

        "furnishing":
            data.furnishing,

        "facing":
            data.facing,

        "balcony":
            data.balcony,

        "amenities":
            data.amenities,

        "amenities_count":
            data.amenities_count,

        "gated_community":
            data.gated_community,

        "security":
            data.security,

        "power_backup":
            data.power_backup,

        "water_supply":
            data.water_supply,

        "property_status":
            data.property_status,

        "metro_distance":
            data.metro_distance,

        "school_distance":
            data.school_distance,

        "hospital_distance":
            data.hospital_distance,

        "main_road_distance":
            data.main_road_distance,

    }


    input_df = pd.DataFrame(
        [input_data]
    )


    input_df = input_df[
        FEATURE_COLUMNS
    ]


    return input_df


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict", dependencies=[Depends(get_current_user)])
def predict(
    data: PropertyData
):

    if model is None:

        raise HTTPException(
            status_code=500,
            detail="ML model is not loaded."
        )

    if not os.path.exists(DATASET_PATH):
        raise HTTPException(
            status_code=503,
            detail="Training data is unavailable for prediction validation."
        )

    try:
        category_options = get_model_category_options()
        for field, allowed_values in category_options.items():
            value = getattr(data, field)
            if value not in allowed_values:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Unsupported {field}: {value}. "
                        "Choose a value represented in the trained model."
                    )
                )

        location_data = pd.read_csv(
            DATASET_PATH,
            usecols=["location", "locality"]
        )
        valid_localities = set(
            location_data.loc[
                location_data["location"] == data.location,
                "locality"
            ].dropna().astype(str)
        )
        if data.locality not in valid_localities:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"{data.locality} is not a trained locality in "
                    f"{data.location}. Choose a matching locality."
                )
            )

        input_df = prepare_input(
            data
        )


        prediction = model.predict(
            input_df
        )


        predicted_price = float(
            prediction[0]
        )


        if predicted_price < 0:

            raise ValueError(
                "Model returned a negative property price."
            )


        predicted_price_crore = (
            predicted_price / 10_000_000
        )


        return {

            "success": True,

            "predicted_price":
                round(
                    predicted_price,
                    2
                ),

            "predicted_price_inr":
                f"₹{predicted_price:,.0f}",

            "predicted_price_crore":
                round(
                    predicted_price_crore,
                    4
                ),

            "model_type":
                type(
                    getattr(
                        model,
                        "named_steps",
                        {}
                    ).get("model", model)
                ).__name__,

            "features_used":
                len(FEATURE_COLUMNS),

            "message":
                "Property price predicted successfully.",

        }


    except HTTPException:

        raise


    except Exception as error:

        print("=" * 70)
        print("PREDICTION ERROR")
        print("=" * 70)
        print(repr(error))
        print("=" * 70)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

@app.get("/feature-importance")
def feature_importance():

    if model is None:

        raise HTTPException(
            status_code=500,
            detail="ML model is not loaded."
        )


    try:

        estimator = model


        # ----------------------------------------------------
        # FIND TREE ESTIMATOR
        # ----------------------------------------------------

        if hasattr(
            model,
            "named_steps"
        ):

            for step in reversed(
                list(
                    model.named_steps.values()
                )
            ):

                if hasattr(
                    step,
                    "feature_importances_"
                ):

                    estimator = step

                    break


        # ----------------------------------------------------
        # CHECK IMPORTANCE
        # ----------------------------------------------------

        if not hasattr(
            estimator,
            "feature_importances_"
        ):

            return {

                "success": False,

                "feature_importance": [],

                "message":
                    "Feature importance is not available."

            }


        # ----------------------------------------------------
        # FEATURE NAMES
        # ----------------------------------------------------

        feature_names = []


        if hasattr(
            model,
            "named_steps"
        ):

            preprocessor = (
                model.named_steps.get(
                    "preprocessor"
                )
            )


            if preprocessor is not None:

                try:

                    feature_names = list(
                        preprocessor
                        .get_feature_names_out()
                    )

                except Exception:

                    feature_names = []


        # ----------------------------------------------------
        # IMPORTANCES
        # ----------------------------------------------------

        importances = (
            estimator.feature_importances_
        )


        feature_data = []


        for index, value in enumerate(
            importances
        ):

            if index < len(
                feature_names
            ):

                name = feature_names[
                    index
                ]

            elif index < len(
                FEATURE_COLUMNS
            ):

                name = FEATURE_COLUMNS[
                    index
                ]

            else:

                name = (
                    f"Feature {index + 1}"
                )


            feature_data.append({

                "feature": name,

                "importance": round(
                    float(value),
                    6
                ),

            })


        feature_data.sort(
            key=lambda item:
                item["importance"],
            reverse=True
        )


        return {

            "success": True,

            "feature_importance":
                feature_data,

        }


    except Exception as error:

        print("=" * 70)
        print("FEATURE IMPORTANCE ERROR")
        print("=" * 70)
        print(repr(error))
        print("=" * 70)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    backend_port = int(os.getenv("API_PORT", "8001"))

    print("=" * 70)
    print("STARTING ESTATEAI BACKEND")
    print("=" * 70)

    print(
        "MAIN FILE:"
    )

    print(
        os.path.abspath(__file__)
    )

    print()

    print(
        "MODEL FILE:"
    )

    print(
        MODEL_PATH
    )

    print()

    print(
        "BACKEND:"
    )

    print(
        f"http://127.0.0.1:{backend_port}"
    )

    print()

    print(
        "FRONTEND:"
    )

    print(
        "http://localhost:5174"
    )

    print("=" * 70)


    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=backend_port,
        reload=True
    )