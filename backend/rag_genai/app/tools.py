"""Agent tools backed by the historical dataset and the trained price model."""

import threading
from functools import cached_property

import joblib
import pandas as pd

from . import config

FEATURE_COLUMNS = [
    "location", "locality", "property_type", "area", "bedrooms", "bathrooms",
    "floor", "total_floors", "property_age", "parking", "lift", "furnishing",
    "facing", "balcony", "amenities", "amenities_count", "gated_community",
    "security", "power_backup", "water_supply", "property_status",
    "metro_distance", "school_distance", "hospital_distance", "main_road_distance",
]

COLUMN_LABELS = {
    "location": "City", "locality": "Locality", "property_type": "Property type",
    "area": "Built-up area", "bedrooms": "Bedrooms", "bathrooms": "Bathrooms",
    "floor": "Floor", "total_floors": "Total floors", "property_age": "Property age",
    "parking": "Parking", "lift": "Lift", "furnishing": "Furnishing",
    "facing": "Facing", "balcony": "Balconies", "amenities": "Amenities",
    "amenities_count": "Amenity count", "gated_community": "Gated community",
    "security": "Security", "power_backup": "Power backup",
    "water_supply": "Water supply", "property_status": "Property status",
    "metro_distance": "Metro distance", "school_distance": "School distance",
    "hospital_distance": "Hospital distance", "main_road_distance": "Main road distance",
}


def format_inr(value: float) -> str:
    """Indian short form: ₹1.25 Cr, ₹45.0 L, or ₹9,500."""
    if value >= 1e7:
        return f"₹{value / 1e7:.2f} Cr"
    if value >= 1e5:
        return f"₹{value / 1e5:.1f} L"
    return f"₹{value:,.0f}"


class PropertyData:
    """Lazily loads the dataset and model once per process."""

    def __init__(self) -> None:
        self._lock = threading.Lock()

    @cached_property
    def frame(self) -> pd.DataFrame:
        frame = pd.read_csv(config.DATA_PATH)
        frame["price_per_sqft"] = frame["price"] / frame["area"]
        return frame

    @cached_property
    def model(self):
        with self._lock:
            return joblib.load(config.MODEL_PATH)

    @property
    def cities(self) -> list[str]:
        return sorted(self.frame["location"].dropna().unique().tolist())

    @property
    def property_types(self) -> list[str]:
        return sorted(self.frame["property_type"].dropna().unique().tolist())

    @cached_property
    def locality_city(self) -> dict[str, str]:
        pairs = self.frame[["locality", "location"]].drop_duplicates()
        return dict(zip(pairs["locality"], pairs["location"]))

    # ---------------------------------------------------------------- tools

    def _filter(self, city=None, locality=None, property_type=None, bedrooms=None):
        frame = self.frame
        if locality:
            frame = frame[frame["locality"] == locality]
        elif city:
            frame = frame[frame["location"] == city]
        if property_type:
            frame = frame[frame["property_type"] == property_type]
        if bedrooms:
            frame = frame[frame["bedrooms"] == bedrooms]
        return frame

    def market_stats(self, city=None, locality=None, property_type=None, bedrooms=None) -> dict:
        """Median price, price/sq ft and spread for a segment of the dataset.

        Drops the most specific filters if the segment has fewer than 5 records.
        """
        filters = {"city": city, "locality": locality, "property_type": property_type, "bedrooms": bedrooms}
        relaxed: list[str] = []
        frame = self._filter(**filters)
        for key in ("bedrooms", "property_type", "locality"):
            if len(frame) >= 5 or not filters[key]:
                continue
            filters[key] = None
            relaxed.append(key)
            if key == "locality" and not filters["city"] and locality:
                filters["city"] = self.locality_city.get(locality)
            frame = self._filter(**filters)

        if frame.empty:
            return {"count": 0, "filters": filters, "relaxed": relaxed}

        return {
            "count": int(len(frame)),
            "filters": {key: value for key, value in filters.items() if value},
            "relaxed": relaxed,
            "median_price": float(frame["price"].median()),
            "p25_price": float(frame["price"].quantile(0.25)),
            "p75_price": float(frame["price"].quantile(0.75)),
            "median_ppsf": float(frame["price_per_sqft"].median()),
            "median_area": float(frame["area"].median()),
        }

    def compare(self, segments: list[dict]) -> list[dict]:
        rows = []
        for segment in segments:
            stats = self.market_stats(**segment)
            stats["label"] = segment_label(segment)
            rows.append(stats)
        return sorted(rows, key=lambda row: -row.get("median_ppsf", 0))

    def estimate_price(self, spec: dict) -> dict:
        """Runs the trained model. Missing inputs use typical values from the
        most similar segment, and are reported back as assumptions."""
        city = spec.get("city") or (self.locality_city.get(spec.get("locality")) if spec.get("locality") else None)
        segment = self._filter(city=city, property_type=spec.get("property_type"))
        if len(segment) < 5:
            segment = self._filter(city=city)
        if segment.empty:
            segment = self.frame

        row: dict = {}
        assumed: list[str] = []
        for column in FEATURE_COLUMNS:
            series = segment[column]
            row[column] = (
                series.median() if pd.api.types.is_numeric_dtype(series) else series.mode().iloc[0]
            )

        provided = {
            "location": city,
            "locality": spec.get("locality"),
            "property_type": spec.get("property_type"),
            "area": spec.get("area"),
            "bedrooms": spec.get("bedrooms"),
        }
        for column, value in provided.items():
            if value:
                row[column] = value
        if not spec.get("locality"):
            # Keep locality consistent with the chosen city.
            row["locality"] = segment["locality"].mode().iloc[0]
        if spec.get("bedrooms") and not spec.get("bathrooms"):
            row["bathrooms"] = max(1, int(spec["bedrooms"]) - 1)

        for column in ("location", "locality", "property_type", "area", "bedrooms"):
            if not provided.get(column) and not (column == "location" and city):
                assumed.append(f"{COLUMN_LABELS[column]}: {format_value(column, row[column])}")
        assumed.append("Other features: typical values for similar properties")

        prediction = float(self.model.predict(pd.DataFrame([row])[FEATURE_COLUMNS])[0])
        return {
            "estimate": max(prediction, 0.0),
            "price_per_sqft": max(prediction, 0.0) / float(row["area"]),
            "inputs": {
                "City": row["location"],
                "Locality": row["locality"],
                "Type": row["property_type"],
                "Area": f"{float(row['area']):,.0f} sq ft",
                "Bedrooms": f"{int(row['bedrooms'])} BHK",
            },
            "assumptions": assumed,
        }

    def top_factors(self, limit: int = 6) -> list[dict]:
        """Model feature importance, with one-hot columns summed per input."""
        preprocessor = self.model.named_steps["preprocessor"]
        estimator = self.model.named_steps["model"]
        names = preprocessor.get_feature_names_out()
        totals: dict[str, float] = {}
        for name, importance in zip(names, estimator.feature_importances_):
            base = name.split("__", 1)[-1]
            column = next(
                (c for c in sorted(FEATURE_COLUMNS, key=len, reverse=True)
                 if base == c or base.startswith(f"{c}_")),
                base,
            )
            totals[column] = totals.get(column, 0.0) + float(importance)
        total = sum(totals.values()) or 1.0
        ranked = sorted(totals.items(), key=lambda item: -item[1])[:limit]
        return [
            {"factor": COLUMN_LABELS.get(column, column), "share": value / total}
            for column, value in ranked
        ]


def format_value(column: str, value) -> str:
    if column == "area":
        return f"{float(value):,.0f} sq ft"
    if column == "bedrooms":
        return f"{int(value)} BHK"
    return str(value)


def segment_label(segment: dict) -> str:
    parts = [
        segment.get("locality") or segment.get("city"),
        segment.get("property_type"),
        f"{segment['bedrooms']} BHK" if segment.get("bedrooms") else None,
    ]
    return " · ".join(part for part in parts if part) or "All Delhi-NCR"


property_data = PropertyData()
