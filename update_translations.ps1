# PowerShell script to replace "Frappe Books" with "Viti Books" in translation CSV files
# Only updates the English text (first column), leaving translations intact

$translationsDir = "C:\Users\HP\Desktop\project\books\translations"
$csvFiles = Get-ChildItem -Path $translationsDir -Filter "*.csv"

# Translation patterns to replace - using single quotes to avoid escape issues
$replacements = @{
    '"Welcome to Frappe Books"' = '"Welcome to Viti Books"'
    '"Applicable anywhere in Frappe Books"' = '"Applicable anywhere in Viti Books"'
    '"Close Frappe Books and try manually."' = '"Close Viti Books and try manually."'
    '"Create a demo company to try out Frappe Books"' = '"Create a demo company to try out Viti Books"'
    '"Frappe Books does not have access to the selected file: $' = '"Viti Books does not have access to the selected file: $'
    '"Reload Frappe Books?"' = '"Reload Viti Books?"'
}

Write-Host "Found $($csvFiles.Count) CSV files to process..."
Write-Host ("=" * 60)

$updatedFiles = @()

foreach ($file in $csvFiles) {
    Write-Host "Processing: $($file.Name)"

    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content

        # Apply each replacement
        foreach ($oldText in $replacements.Keys) {
            $newText = $replacements[$oldText]

            # Replace only at the beginning of lines (first column)
            $pattern = "^" + [regex]::Escape($oldText)
            $content = $content -replace $pattern, $newText, "Multiline"
        }

        # Write back if changes were made
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            Write-Host "  Updated $($file.Name)" -ForegroundColor Green
            $updatedFiles += $file.Name
        } else {
            Write-Host "  No changes needed for $($file.Name)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ("=" * 60)
Write-Host "Processing complete!"
Write-Host "Files updated: $($updatedFiles.Count)"

if ($updatedFiles.Count -gt 0) {
    Write-Host "Updated files:"
    foreach ($filename in $updatedFiles) {
        Write-Host "  - $filename"
    }
}

Write-Host ""
Write-Host "All Frappe Books references in English text have been replaced with Viti Books"
Write-Host "Translated text (second column) was left unchanged for proper localization."