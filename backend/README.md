# EstateIQ API and authentication

The FastAPI service serves both the property prediction API and authentication
API on port 8001 by default (`API_PORT` can override it). Authentication uses PostgreSQL and HttpOnly access and
refresh cookies; credentials and tokens are never stored in browser local
storage.

## Configure PostgreSQL and secrets

If `.env` does not exist, copy `.env.example` to `.env`; otherwise, add the
missing settings without replacing the existing file. Use the same PostgreSQL
credentials in `DATABASE_URL` and the `POSTGRES_*` variables. Replace both JWT
keys with different, randomly generated values. Keep `.env` private.

From the repository root:

```powershell
docker compose --env-file backend/.env up -d postgres
```

## Set up Python and train the model

Use Python 3.12 for the backend and training. In PowerShell, from
`backend` (or run the commands below from the repository root with
`Set-Location .\backend` first):

```powershell
py -3.12 -m venv .venv312
.\.venv312\Scripts\Activate.ps1
pip install -r requirement.txt
python -c "import scipy, sklearn; print('SciPy', scipy.__version__, '| scikit-learn', sklearn.__version__)"
python train_model.py
```

Always activate `.venv312` before using `python`; otherwise PowerShell may run
the global Python installation and load its packages from your user profile.
The script checks that it is running in `.venv312` and prints the activation
command if another Python interpreter is selected.

## Start the API

With `.venv312` activated, start the API from `backend`:

```powershell
python main.py
```

The API reads its configuration from `backend\.env` regardless of the
PowerShell working directory. Port 8000 may already be used by another local
service; set `API_PORT` in `.env` if 8001 is unavailable.

The existing `users` table is reused. On startup, missing authentication
columns are added without deleting existing user records. New signups require
a name, email, phone number, and password; account creation also signs the user
in. Prediction requests to `POST /predict` require an authenticated cookie
session. The frontend loads valid categorical inputs and supported
city/locality pairs from `GET /prediction-options`, which reflects the
currently loaded model and training data. `GET /feature-importance` exposes
the fitted model's relative feature importances for the model-insights panel.

## Frontend

The Vite app runs at `http://localhost:5173` (or `5174` if 5173 is busy) and
uses `http://localhost:8001`
by default. Set `VITE_API_URL` in the frontend `.env` only when the API is
hosted at another origin. If the frontend origin changes, update
`FRONTEND_ORIGIN` in the backend `.env` as well.

Use `COOKIE_SECURE=true` when serving the API over HTTPS.
