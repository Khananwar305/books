$files = Get-ChildItem "C:\Users\HP\Desktop\project\books\translations\*.csv"

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."

    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # Replace the patterns
    $content = $content -replace '^"Welcome to Frappe Books"', '"Welcome to Viti Books"', 'Multiline'
    $content = $content -replace '^"Applicable anywhere in Frappe Books"', '"Applicable anywhere in Viti Books"', 'Multiline'
    $content = $content -replace '^"Close Frappe Books and try manually\."', '"Close Viti Books and try manually."', 'Multiline'
    $content = $content -replace '^"Create a demo company to try out Frappe Books"', '"Create a demo company to try out Viti Books"', 'Multiline'
    $content = $content -replace '^"Frappe Books does not have access to the selected file', '"Viti Books does not have access to the selected file', 'Multiline'
    $content = $content -replace '^"Reload Frappe Books\?"', '"Reload Viti Books?"', 'Multiline'

    Set-Content $file.FullName -Value $content -Encoding UTF8
}