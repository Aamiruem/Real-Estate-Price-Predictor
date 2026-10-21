# from datetime import datetime

# from sqlalchemy import (
#     Column,
#     DateTime,
#     Float,
#     ForeignKey,
#     Integer,
#     String,
#     Text,
# )
# from sqlalchemy.orm import relationship

# from database import Base


# # ============================================================
# # USER TABLE
# # ============================================================

# class User(Base):
#     """
#     Stores application users.
#     """

#     __tablename__ = "users"

#     id = Column(
#         Integer,
#         primary_key=True,
#         index=True,
#     )

#     name = Column(
#         String(150),
#         nullable=False,
#     )

#     email = Column(
#         String(255),
#         unique=True,
#         index=True,
#         nullable=False,
#     )

#     password_hash = Column(
#         String(255),
#         nullable=True,
#     )

#     created_at = Column(
#         DateTime,
#         default=datetime.utcnow,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Relationship
#     # --------------------------------------------------------

#     properties = relationship(
#         "Property",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )


# # ============================================================
# # PROPERTY TABLE
# # ============================================================

# class Property(Base):
#     """
#     Stores property information submitted by users.
#     """

#     __tablename__ = "properties"

#     id = Column(
#         Integer,
#         primary_key=True,
#         index=True,
#     )

#     user_id = Column(
#         Integer,
#         ForeignKey("users.id"),
#         nullable=True,
#         index=True,
#     )

#     # --------------------------------------------------------
#     # Basic Property Information
#     # --------------------------------------------------------

#     location = Column(
#         String(150),
#         nullable=False,
#     )

#     locality = Column(
#         String(150),
#         nullable=False,
#     )

#     property_type = Column(
#         String(100),
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Property Dimensions
#     # --------------------------------------------------------

#     area = Column(
#         Float,
#         nullable=False,
#     )

#     bedrooms = Column(
#         Integer,
#         nullable=False,
#     )

#     bathrooms = Column(
#         Integer,
#         nullable=False,
#     )

#     floor = Column(
#         Integer,
#         nullable=False,
#     )

#     total_floors = Column(
#         Integer,
#         nullable=False,
#     )

#     property_age = Column(
#         Integer,
#         nullable=False,
#     )

#     parking = Column(
#         Integer,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Property Features
#     # --------------------------------------------------------

#     lift = Column(
#         String(20),
#         nullable=False,
#     )

#     furnishing = Column(
#         String(50),
#         nullable=False,
#     )

#     facing = Column(
#         String(50),
#         nullable=False,
#     )

#     balcony = Column(
#         Integer,
#         nullable=False,
#     )

#     amenities = Column(
#         Text,
#         nullable=True,
#     )

#     amenities_count = Column(
#         Integer,
#         nullable=False,
#         default=0,
#     )

#     # --------------------------------------------------------
#     # Community / Facilities
#     # --------------------------------------------------------

#     gated_community = Column(
#         String(20),
#         nullable=False,
#     )

#     security = Column(
#         String(20),
#         nullable=False,
#     )

#     power_backup = Column(
#         String(20),
#         nullable=False,
#     )

#     water_supply = Column(
#         String(50),
#         nullable=False,
#     )

#     property_status = Column(
#         String(50),
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Distance Features
#     # --------------------------------------------------------

#     metro_distance = Column(
#         Float,
#         nullable=False,
#     )

#     school_distance = Column(
#         Float,
#         nullable=False,
#     )

#     hospital_distance = Column(
#         Float,
#         nullable=False,
#     )

#     main_road_distance = Column(
#         Float,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Timestamp
#     # --------------------------------------------------------

#     created_at = Column(
#         DateTime,
#         default=datetime.utcnow,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Relationships
#     # --------------------------------------------------------

#     user = relationship(
#         "User",
#         back_populates="properties",
#     )

#     predictions = relationship(
#         "Prediction",
#         back_populates="property",
#         cascade="all, delete-orphan",
#     )


# # ============================================================
# # PREDICTION TABLE
# # ============================================================

# class Prediction(Base):
#     """
#     Stores ML prediction results for a property.
#     """

#     __tablename__ = "predictions"

#     id = Column(
#         Integer,
#         primary_key=True,
#         index=True,
#     )

#     property_id = Column(
#         Integer,
#         ForeignKey("properties.id"),
#         nullable=False,
#         index=True,
#     )

#     # --------------------------------------------------------
#     # Prediction Values
#     # --------------------------------------------------------

#     predicted_price = Column(
#         Float,
#         nullable=False,
#     )

#     price_per_sqft = Column(
#         Float,
#         nullable=False,
#     )

#     min_price = Column(
#         Float,
#         nullable=False,
#     )

#     max_price = Column(
#         Float,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Model Information
#     # --------------------------------------------------------

#     model_version = Column(
#         String(100),
#         nullable=False,
#         default="random-forest-v1",
#     )

#     created_at = Column(
#         DateTime,
#         default=datetime.utcnow,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Relationship
#     # --------------------------------------------------------

#     property = relationship(
#         "Property",
#         back_populates="predictions",
#     )





from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from database.database import Base


# ============================================================
# USER MODEL
# ============================================================

class User(Base):

    __tablename__ = "users"


    # --------------------------------------------------------
    # ID
    # --------------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    # --------------------------------------------------------
    # NAME
    # --------------------------------------------------------

    name = Column(
        String(100),
        nullable=False
    )


    # --------------------------------------------------------
    # EMAIL
    # --------------------------------------------------------

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )


    # --------------------------------------------------------
    # PHONE
    # --------------------------------------------------------

    phone = Column(
        String(20),
        unique=True,
        nullable=True
    )


    # --------------------------------------------------------
    # PASSWORD
    # --------------------------------------------------------

    password_hash = Column(
        String(255),
        nullable=False
    )


    # --------------------------------------------------------
    # ACTIVE STATUS
    # --------------------------------------------------------

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )


    # --------------------------------------------------------
    # EMAIL VERIFIED
    # --------------------------------------------------------

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False
    )


    # --------------------------------------------------------
    # VERIFICATION TOKEN
    # --------------------------------------------------------

    verification_token = Column(
        String(255),
        nullable=True,
        index=True
    )


    # --------------------------------------------------------
    # ROLE
    # --------------------------------------------------------

    role = Column(
        String(30),
        default="user",
        server_default="user",
        nullable=False
    )


    # --------------------------------------------------------
    # TIMESTAMPS
    # --------------------------------------------------------

    # Python-side defaults are needed because existing databases
    # may have these columns without a server default.
    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


# ============================================================
# CONTACT ENQUIRY MODEL
# ============================================================

class ContactEnquiry(Base):

    __tablename__ = "contact_enquiries"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(String(255), nullable=False, index=True)

    phone = Column(String(20), nullable=True)

    enquiry_type = Column(String(50), nullable=False)

    message = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
