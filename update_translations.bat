@echo off
cd /d "C:\Users\HP\Desktop\project\books\translations"

echo Updating translation files to replace "Frappe Books" with "Viti Books"...
echo.

for %%f in (*.csv) do (
    echo Processing %%f...

    powershell -Command "(Get-Content '%%f') -replace '^\"Welcome to Frappe Books\"', '\"Welcome to Viti Books\"' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace '^\"Applicable anywhere in Frappe Books\"', '\"Applicable anywhere in Viti Books\"' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace '^\"Close Frappe Books and try manually\.\"', '\"Close Viti Books and try manually.\"' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace '^\"Create a demo company to try out Frappe Books\"', '\"Create a demo company to try out Viti Books\"' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace '^\"Frappe Books does not have access to the selected file', '\"Viti Books does not have access to the selected file' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace '^\"Reload Frappe Books\?\""', '\"Reload Viti Books?\"' | Set-Content '%%f'"
)

echo.
echo Translation update complete!
echo All "Frappe Books" references in English text have been replaced with "Viti Books"
echo Translated text (second column) was left unchanged for proper localization.

pause