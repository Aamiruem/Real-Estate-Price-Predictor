# Valuation factors

## The 25 model inputs

The price model uses 25 inputs, grouped as they appear on the Predict Price
form:

- Property basics: city, locality, property type, property status
  (Ready to Move, Under Construction or New Launch), built-up area, bedrooms,
  bathrooms and property age.
- Building: floor, total floors, parking slots, balconies and lift.
- Features and amenities: furnishing (Unfurnished, Semi-Furnished or Fully
  Furnished), facing direction, water supply (24x7, 12 Hours or Borewell),
  amenities package, amenity count, gated community, 24x7 security and power
  backup.
- Connectivity: distance in km to the nearest metro station, school, hospital
  and main road.

## What matters most to the model

The model's feature importance shows how much each input contributes to its
decisions. In the trained model, built-up area carries the largest share,
followed by the city. Together they account for most of the model's weight,
which means size and location explain most of the price differences in the
dataset. Other inputs such as property type, metro distance and floors have a
much smaller effect individually. Ask the assistant "what factors matter most"
to see the exact percentages.

## Area

Built-up area is measured in square feet. Larger properties cost more in total,
so comparing properties of different sizes is easier with price per square
foot (price divided by area).

## Location

City and locality capture land value, demand and infrastructure differences.
Two properties of the same size can differ greatly in price depending on the
city or locality.

## Amenities packages

The dataset uses five amenity packages: Gym, Park and Security; Gym, Pool and
Clubhouse; Gym, Pool, Park and Clubhouse; Park, Security and Power Backup; and
Pool, Clubhouse and Lift. The amenity count is the number of amenities in the
chosen package.

## Connectivity

Distances to a metro station, school, hospital and main road describe how well
connected a property is. They are inputs to the model, though their individual
influence on the estimate is smaller than area and city.
