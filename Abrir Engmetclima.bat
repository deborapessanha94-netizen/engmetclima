@echo off
title Engmetclima
cd /d "%~dp0"
start "" "http://127.0.0.1:19010"
node server.js
pause
