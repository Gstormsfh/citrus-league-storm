#!/usr/bin/env python3
"""
production_guardrails.py

Lightweight production monitoring and guardrails for the 2025 model.

This script focuses on:
1. Flagging extreme or invalid values in GAR outputs (player_gar_components).
2. Emitting a simple CSV with top/bottom Total GAR/60 for quick QA.

Scope: 2025 season only. Historical seasons are treated as R&D and ignored here.
"""

import os
from datetime import datetime
from typing import Optional

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client


load_dotenv()

supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise SystemExit(
        "ERROR: Supabase credentials not found. "
        "Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env."
    )

supabase: Client = create_client(supabase_url, supabase_key)


def load_gar_components_2025() -> Optional[pd.DataFrame]:
    """Load 2025 GAR components from player_gar_components."""
    try:
        response = (
            supabase.table("player_gar_components")
            .select("*")
            .eq("season", 2025)
            .execute()
        )
        if not response.data:
            print("⚠️  No GAR components found for season 2025.")
            return None

        df = pd.DataFrame(response.data)
        return df
    except Exception as e:
        print(f"ERROR: Failed to load GAR components: {e}")
        return None


def run_gar_guardrails(df: pd.DataFrame) -> pd.DataFrame:
    """
    Run basic guardrails on GAR outputs.

    Flags:
    - |Total GAR/60| > 1.0 (unusually large in magnitude).
    - NaN in Total GAR/60.
    - TOI total minutes == 0 but non-zero GAR.
    """
    issues = []

    if "total_gar_per_60" not in df.columns:
        print("⚠️  Column total_gar_per_60 not found; skipping GAR/60 guardrail checks.")
        return pd.DataFrame()

    total_col = "total_gar_per_60"
    toi_col = "toi_total_minutes" if "toi_total_minutes" in df.columns else None

    # Extreme magnitude
    mask_extreme = df[total_col].abs() > 1.0
    for _, row in df[mask_extreme].iterrows():
        issues.append(
            {
                "player_id": row.get("player_id"),
                "issue": "extreme_total_gar_per_60",
                "value": row.get(total_col),
            }
        )

    # NaN values
    mask_nan = df[total_col].isna()
    for _, row in df[mask_nan].iterrows():
        issues.append(
            {
                "player_id": row.get("player_id"),
                "issue": "nan_total_gar_per_60",
                "value": None,
            }
        )

    # TOI == 0 but non-zero GAR
    if toi_col:
        mask_zero_toi_nonzero_gar = (df[toi_col] <= 0) & (df[total_col].abs() > 0.01)
        for _, row in df[mask_zero_toi_nonzero_gar].iterrows():
            issues.append(
                {
                    "player_id": row.get("player_id"),
                    "issue": "zero_toi_nonzero_gar",
                    "value": row.get(total_col),
                }
            )

    issues_df = pd.DataFrame(issues)
    if not issues_df.empty:
        print(f"⚠️  GAR guardrails flagged {len(issues_df)} issues.")
    else:
        print("✅ GAR guardrails: no issues found.")

    return issues_df


def export_daily_gar_summary(df: pd.DataFrame, output_dir: str = "data") -> None:
    """Export a simple CSV with top/bottom 20 Total GAR/60 for season 2025."""
    if "total_gar_per_60" not in df.columns:
        print("⚠️  Column total_gar_per_60 not found; skipping summary export.")
        return

    os.makedirs(output_dir, exist_ok=True)
    today_str = datetime.now().strftime("%Y%m%d")
    output_path = os.path.join(output_dir, f"daily_gar_summary_{today_str}.csv")

    df_sorted = df.sort_values("total_gar_per_60", ascending=False)

    top20 = df_sorted.head(20).copy()
    bottom20 = df_sorted.tail(20).copy()

    top20["segment"] = "top20"
    bottom20["segment"] = "bottom20"

    summary = pd.concat([top20, bottom20], ignore_index=True)
    summary.to_csv(output_path, index=False)

    print(f"✅ Exported daily GAR summary to {output_path}")


def main(season: int = 2025) -> None:
    """Run guardrails and export daily summary for the given season (default 2025)."""
    print("=" * 80)
    print(f"PRODUCTION GUARDRAILS - SEASON {season}")
    print("=" * 80)

    df = load_gar_components_2025()
    if df is None:
        return

    issues_df = run_gar_guardrails(df)

    # Optionally, you could write issues_df to disk or a log table.
    if not issues_df.empty:
        issues_path = os.path.join(
            "data",
            f"gar_guardrail_issues_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
        )
        os.makedirs("data", exist_ok=True)
        issues_df.to_csv(issues_path, index=False)
        print(f"⚠️  Detailed guardrail issues saved to {issues_path}")

    export_daily_gar_summary(df)


if __name__ == "__main__":
    main()


