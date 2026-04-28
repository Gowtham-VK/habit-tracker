@echo off
echo Stopping Habit Tracker dev server ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo Killed process %%a
)
echo Done.
