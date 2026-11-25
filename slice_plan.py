import csv
import json
import pathlib
import sys


def convert_json_to_csv(json_path, csv_path, field_names=None):
    path = pathlib.Path(json_path)
    if not path.exists():
        raise SystemExit(f"JSON source not found: {path}")

    with path.open("r", encoding="utf-8") as json_file:
        entries = json.load(json_file)

    if field_names is None:
        field_names = [
            "Day",
            "Title",
            "Reference",
            "Body",
            "Question",
            "Prayer",
            "Tag",
        ]

    with pathlib.Path(csv_path).open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=field_names, extrasaction="ignore")
        writer.writeheader()
        for entry in entries:
            row = {key: entry.get(key, "") for key in field_names}
            writer.writerow(row)


def main():
    if len(sys.argv) < 3:
        print("Usage: python slice_plan.py source.json target.csv")
        sys.exit(1)

    convert_json_to_csv(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    main()
