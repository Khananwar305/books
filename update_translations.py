#!/usr/bin/env python3
"""
Script to replace "Frappe Books" with "Viti Books" in translation CSV files.
Only updates the English text (first column), leaving translations intact.
"""

import os
import re
import glob
from pathlib import Path

# Translation patterns to replace
REPLACEMENTS = [
    ("Welcome to Frappe Books", "Welcome to Viti Books"),
    ("Applicable anywhere in Frappe Books", "Applicable anywhere in Viti Books"),
    ("Close Frappe Books and try manually", "Close Viti Books and try manually"),
    ("Create a demo company to try out Frappe Books", "Create a demo company to try out Viti Books"),
    ("Frappe Books does not have access to the selected file", "Viti Books does not have access to the selected file"),
    ("Reload Frappe Books?", "Reload Viti Books?"),
]

def update_csv_file(file_path):
    """Update a single CSV file with the translation replacements."""
    print(f"Processing: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Apply each replacement
        for old_text, new_text in REPLACEMENTS:
            # Use regex to match the exact pattern in quotes at the beginning of a line
            pattern = f'^"{re.escape(old_text)}"'
            replacement = f'"{new_text}"'

            # Replace only at the beginning of lines (first column)
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

        # Write back if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Updated {file_path}")
            return True
        else:
            print(f"  - No changes needed for {file_path}")
            return False

    except Exception as e:
        print(f"  ✗ Error processing {file_path}: {e}")
        return False

def main():
    """Main function to process all CSV translation files."""
    translations_dir = Path("C:/Users/HP/Desktop/project/books/translations")

    if not translations_dir.exists():
        print(f"Error: Translations directory not found: {translations_dir}")
        return

    # Get all CSV files in the translations directory
    csv_files = list(translations_dir.glob("*.csv"))

    if not csv_files:
        print(f"No CSV files found in {translations_dir}")
        return

    print(f"Found {len(csv_files)} CSV files to process...")
    print("=" * 60)

    updated_files = []

    for csv_file in sorted(csv_files):
        if update_csv_file(csv_file):
            updated_files.append(csv_file.name)

    print("=" * 60)
    print(f"Processing complete!")
    print(f"Files updated: {len(updated_files)}")

    if updated_files:
        print("Updated files:")
        for filename in updated_files:
            print(f"  - {filename}")

    print("\nAll 'Frappe Books' references in English text have been replaced with 'Viti Books'")
    print("Translated text (second column) was left unchanged for proper localization.")

if __name__ == "__main__":
    main()