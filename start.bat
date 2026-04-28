@echo off
cd /d "%~dp0"
echo Starting Habit Tracker dev server on http://0.0.0.0:5174 ...
npm run dev -- --host
