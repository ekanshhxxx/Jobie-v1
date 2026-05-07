@echo off
echo Restoring original dashboard and making it less flashy...
cd /d E:\Projects\jobie\frontend
node restore-and-fix.js
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Dashboard restored and fixed.
    echo Run: npm run dev
) else (
    echo.
    echo FAILED! Check the error above.
)
pause
