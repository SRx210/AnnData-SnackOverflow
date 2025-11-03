@echo off
echo Starting AnnData ML API Server...
echo.
echo Activating Python virtual environment...
call ann-env\Scripts\activate.bat

echo.
echo Starting Flask ML API on port 5000...
python api.py

pause
