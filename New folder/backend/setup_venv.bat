@echo off
echo ========================================
echo Creating Virtual Environment for Driver Monitoring System
echo ========================================

REM Create virtual environment
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
python -m pip install --upgrade pip

REM Install dependencies
pip install -r requirements.txt

echo.
echo ========================================
echo Virtual environment created successfully!
echo ========================================
echo.
echo To activate the virtual environment, run:
echo    venv\Scripts\activate
echo.
echo To deactivate, run:
echo    deactivate
echo.
pause
