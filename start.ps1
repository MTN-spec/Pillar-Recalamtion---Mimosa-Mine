# Start Backend
Start-Process powershell -ArgumentList "py `".\backend\main.py`"" -WindowStyle Normal

# Start Frontend
cd frontend
npm run dev
