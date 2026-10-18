from typing import Optional

from pydantic import BaseModel, Field


class PropertyCreate(BaseModel):

    # =====================================================
    # BASIC INFORMATION
    # =====================================================

    location: str

    locality: str

    property_type: str = "Apartment"

    # =====================================================
    # PROPERTY DETAILS
    # =====================================================

    area: float = Field(
        gt=0,
        description="Property area in square feet",
    )

    bedrooms: int = Field(
        default=0,
        ge=0,
    )

    bathrooms: int = Field(
        default=0,
        ge=0,
    )

    floor: int = Field(
        default=0,
        ge=0,
    )

    total_floors: int = Field(
        default=0,
        ge=0,
    )

    property_age: int = Field(
        default=0,
        ge=0,
    )

    parking: int = Field(
        default=0,
        ge=0,
    )

    # =====================================================
    # FEATURES
    # =====================================================

    lift: str = "No"

    furnishing: str = "Unfurnished"

    facing: str = "North"

    balcony: int = Field(
        default=0,
        ge=0,
    )

    amenities: Optional[str] = ""

    amenities_count: int = Field(
        default=0,
        ge=0,
    )

    # =====================================================
    # COMMUNITY
    # =====================================================

    gated_community: str = "No"

    security: str = "No"

    power_backup: str = "No"

    water_supply: str = "24x7"

    property_status: str = "Ready to Move"

    # =====================================================
    # DISTANCES
    # =====================================================

    metro_distance: float = Field(
        default=0,
        ge=0,
    )

    school_distance: float = Field(
        default=0,
        ge=0,
    )

    hospital_distance: float = Field(
        default=0,
        ge=0,
    )

    main_road_distance: float = Field(
        default=0,
        ge=0,
    )


# =========================================================
# PROPERTY RESPONSE
# =========================================================

class PropertyResponse(PropertyCreate):

    id: int

    class Config:
        from_attributes = True