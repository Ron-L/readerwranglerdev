@echo off
REM Build script for SKILL-ReaderWrangler.zip
REM This script creates a properly formatted Skills zip file from the source markdown

echo Building SKILL-ReaderWrangler.zip...

REM Copy source to SKILL.md
copy /Y SKILL-ReaderWrangler.md SKILL.md >nul

REM Create zip using PowerShell
powershell -Command "Compress-Archive -Path SKILL.md -DestinationPath SKILL-ReaderWrangler.zip -Force"

REM Clean up temporary file
del SKILL.md

echo Done! SKILL-ReaderWrangler.zip created successfully.
echo Remember to upload this to Claude Skills interface.
