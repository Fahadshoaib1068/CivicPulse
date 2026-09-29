"""Build the HPA chart from recorded k6/HPA observations."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import matplotlib.pyplot as plt


REQUIRED_COLUMNS = {
    "elapsed_seconds",
    "offered_requests_per_second",
    "backend_replicas",
}


def read_samples(path: Path) -> list[tuple[float, float, int]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = set(reader.fieldnames or [])
        missing = REQUIRED_COLUMNS - columns
        if missing:
            missing_columns = ", ".join(sorted(missing))
            raise ValueError(f"Missing required CSV columns: {missing_columns}")

        samples = []
        for row_number, row in enumerate(reader, start=2):
            try:
                elapsed_seconds = float(row["elapsed_seconds"])
                offered_rps = float(row["offered_requests_per_second"])
                backend_replicas = int(row["backend_replicas"])
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Invalid measurement on CSV row {row_number}") from exc

            if elapsed_seconds < 0 or offered_rps < 0 or backend_replicas < 1:
                raise ValueError(f"Invalid measurement on CSV row {row_number}")
            samples.append((elapsed_seconds, offered_rps, backend_replicas))

    if not samples:
        raise ValueError("No recorded measurements found; refusing to create a chart")
    return samples


def build_chart(samples: list[tuple[float, float, int]], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    elapsed, offered_rps, replicas = zip(*samples)

    figure, axis = plt.subplots(figsize=(8, 4.8), dpi=180)
    axis.step(offered_rps, replicas, where="mid", color="#176b87", linewidth=2)
    axis.scatter(offered_rps, replicas, color="#d45d3f", edgecolors="white", zorder=3)
    for time_seconds, load, replica_count in samples:
        axis.annotate(
            f"t={time_seconds:g}s",
            (load, replica_count),
            textcoords="offset points",
            xytext=(0, 7),
            ha="center",
            fontsize=7,
        )

    axis.set_title("Backend Replicas vs Offered Load")
    axis.set_xlabel("Offered load (requests/second)")
    axis.set_ylabel("Backend replicas")
    axis.set_yticks(sorted(set(replicas)))
    axis.grid(axis="y", alpha=0.25)
    figure.tight_layout()
    figure.savefig(output, format="png")
    plt.close(figure)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build_chart(read_samples(args.input), args.output)


if __name__ == "__main__":
    main()