# EstateIQ guide

## What EstateIQ does

EstateIQ estimates residential property prices in Delhi-NCR. A machine-learning
model (a Random Forest regressor) was trained on a historical dataset of
property records and predicts a price from the details of a property. The
result is an estimate, not a formal appraisal, a guaranteed sale price, a live
listing or financial advice.

## Coverage

The model supports five cities: Delhi, Gurgaon, Noida, Greater Noida and
Faridabad. Each city has five localities in the dataset:

- Delhi: Rohini, Greater Kailash, Saket, Vasant Kunj, Dwarka
- Gurgaon: Golf Course Road, MG Road, Sohna Road, New Gurgaon, Dwarka Expressway
- Noida: Sector 62, Sector 75, Sector 78, Sector 137, Sector 150
- Greater Noida: Alpha, Beta, Knowledge Park, Techzone, Yamuna Expressway
- Faridabad: NIT, Sector 14, Sector 15, Sector 88, Greater Faridabad

It supports four property types: Apartment, Builder Floor, Plot and Villa.
Properties outside these cities, localities or types cannot be estimated.

## The historical dataset

The dataset (data/property_data.csv) holds historical records with
city, locality, property type, area, bedrooms, bathrooms, building details,
amenities, distances to services and the recorded price. Statistics from it
describe those records only. They are not current market quotes and should not
be presented as live prices.

## How the AI assistant works

The assistant is an agentic retrieval-augmented generation (RAG) system. For
each question it plans which tools to use, then:

- queries dataset statistics (median price, price per sq ft, typical range),
- compares cities or localities,
- runs the trained price model for a quick estimate when you give an area or
  configuration,
- reads the model's feature importance to explain what drives prices,
- searches this guide using hybrid retrieval (keyword BM25 plus semantic
  embeddings when available).

A local language model running in Ollama then writes the answer from those
results and cites them with numbered markers like [1]. Questions and answers
stay on the local machine and are not sent to a hosted AI provider. If Ollama
is not running, the assistant still answers directly from the tool results.

## Assistant estimates versus Predict Price

A quick estimate in the assistant fills any details you did not mention with
typical values for similar properties, and lists those assumptions. For an
estimate based on all 25 details of a specific property, use the Predict Price
page.
