"""Offline Axe Bobby research workbench.

This is a deliberately small extraction of the parent project's scoring and
market-gate rules.  It accepts synthetic research snapshots and returns an
auditable result.  It never fetches prices, reads positions, or places orders.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date
import json
import math
from typing import Any, Iterable


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise ValueError("score inputs must be finite numbers")
    return max(low, min(high, number))


def _average(values: Iterable[float]) -> float:
    items = [_clamp(value) for value in values]
    return sum(items) / len(items) if items else 0.0


@dataclass(frozen=True)
class ResearchProfile:
    """Synthetic research inputs matching the seven source score buckets."""

    symbol: str
    name: str
    demand_rigidity: float
    supply_shortage: float
    capex_confirmation: float
    pricing_power: float
    early_signal_strength: float
    kol_heat: float
    sell_side_lag: float
    price_in_risk: float
    macro_tailwind: float
    policy_support: float
    liquidity_score: float
    revenue_growth: float
    gross_margin_trend: float
    peg_reasonable: float
    chip_concentration: float
    profit_taking_pressure: float
    overhead_supply: float
    cross_market_confirmation: float
    relative_strength: float
    drawdown_from_high: float
    stop_loss_ready: bool
    thesis: str


@dataclass(frozen=True)
class EntryEvidence:
    """Closed-bar evidence supplied by the offline demo.

    The parent project calculates these observations from completed candles.
    The release keeps only the scoring contract so it has no market-data
    dependency.
    """

    near_support: bool = False
    support_reclaimed: bool = False
    bullish_sequence: bool = False
    ema_reclaimed: bool = False
    risk_reward_ok: bool = False

    @property
    def score(self) -> int:
        weights = {
            "near_support": 1,
            "support_reclaimed": 3,
            "bullish_sequence": 2,
            "ema_reclaimed": 2,
            "risk_reward_ok": 1,
        }
        return sum(weight for field, weight in weights.items() if getattr(self, field))

    @property
    def state(self) -> str:
        if self.score >= 8:
            return "RIGHT_SIDE_CONFIRMATION"
        if self.score >= 6:
            return "SMALL_LEFT_SIDE_TEST"
        if self.score >= 4:
            return "WATCH"
        return "WAIT"


@dataclass(frozen=True)
class DimensionScore:
    name: str
    raw_score: float
    weight: float
    weighted_score: float
    evidence: tuple[str, ...]


@dataclass(frozen=True)
class ResearchScore:
    total_score: float
    action: str
    dimensions: tuple[DimensionScore, ...]
    strengths: tuple[str, ...]
    vetoes: tuple[str, ...]
    suggested_position_pct: float


@dataclass(frozen=True)
class MarketSnapshot:
    as_of: str
    data_date: str | None
    data_status: str
    regime: str
    position_cap_pct: float
    new_long_allowed: bool
    reasons: tuple[str, ...]


@dataclass(frozen=True)
class WorkbenchResult:
    symbol: str
    name: str
    action: str
    manual_review_required: bool
    research_score: float
    research_action: str
    entry_score: int
    entry_state: str
    suggested_position_pct: float
    market_status: str
    market_regime: str
    reasons: tuple[str, ...]
    blockers: tuple[str, ...]
    review_steps: tuple[str, ...]
    dimensions: tuple[DimensionScore, ...]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


_DIMENSION_WEIGHTS = {
    "SUPPLY_DEMAND": 0.25,
    "SENTIMENT_INFORMATION": 0.15,
    "MACRO": 0.15,
    "FINANCIAL_CAPEX": 0.15,
    "POSITIONING": 0.15,
    "CROSS_MARKET": 0.10,
    "DISCIPLINE": 0.05,
}


def score_research(profile: ResearchProfile) -> ResearchScore:
    """Score a profile with the parent framework's seven weighted buckets."""

    dimensions = (
        _dimension(
            "SUPPLY_DEMAND",
            _average(
                [
                    profile.demand_rigidity,
                    profile.supply_shortage,
                    profile.capex_confirmation,
                    profile.pricing_power,
                ]
            ),
            _evidence(
                (profile.demand_rigidity >= 75, "demand looks relatively rigid"),
                (profile.supply_shortage >= 75, "supply is constrained"),
                (profile.capex_confirmation >= 75, "capex confirms demand"),
            ),
        ),
        _dimension(
            "SENTIMENT_INFORMATION",
            _average(
                [
                    profile.early_signal_strength,
                    min(profile.kol_heat, 80),
                    100 - profile.price_in_risk,
                    100 - max(profile.sell_side_lag - 60, 0),
                ]
            ),
            _evidence(
                (profile.early_signal_strength >= 70, "early information is useful"),
                (profile.price_in_risk >= 70, "price may already reflect the narrative"),
                (profile.sell_side_lag >= 70, "sell-side attention is already high"),
            ),
        ),
        _dimension(
            "MACRO",
            _average([profile.macro_tailwind, profile.policy_support, profile.liquidity_score]),
            _evidence(
                (profile.macro_tailwind >= 70, "macro backdrop is supportive"),
                (profile.policy_support >= 70, "policy support is visible"),
                (profile.liquidity_score < 45, "liquidity is a constraint"),
            ),
        ),
        _dimension(
            "FINANCIAL_CAPEX",
            _average(
                [
                    profile.revenue_growth,
                    profile.gross_margin_trend,
                    profile.peg_reasonable,
                    profile.capex_confirmation,
                ]
            ),
            _evidence(
                (profile.revenue_growth >= 70, "revenue growth supports the thesis"),
                (profile.gross_margin_trend >= 70, "margin trend supports pricing power"),
                (profile.peg_reasonable < 45, "valuation is not cheap relative to growth"),
            ),
        ),
        _dimension(
            "POSITIONING",
            _average(
                [
                    profile.chip_concentration,
                    100 - profile.profit_taking_pressure,
                    100 - profile.overhead_supply,
                    100 - min(profile.drawdown_from_high * 1.5, 100),
                ]
            ),
            _evidence(
                (profile.profit_taking_pressure >= 70, "profit-taking pressure is high"),
                (profile.overhead_supply >= 65, "overhead supply may slow the move"),
                (profile.chip_concentration >= 65, "positioning is relatively concentrated"),
            ),
        ),
        _dimension(
            "CROSS_MARKET",
            _average([profile.cross_market_confirmation, profile.relative_strength]),
            _evidence(
                (profile.cross_market_confirmation >= 70, "cross-market confirmation is present"),
                (profile.relative_strength >= 70, "relative strength leads"),
                (profile.relative_strength < 45, "relative strength is weak"),
            ),
        ),
        _dimension(
            "DISCIPLINE",
            _clamp(
                (80 if profile.stop_loss_ready else 35)
                - (20 if profile.price_in_risk >= 80 else 0)
                - (15 if profile.profit_taking_pressure >= 80 else 0)
            ),
            _evidence(
                (profile.stop_loss_ready, "a stop condition is defined"),
                (not profile.stop_loss_ready, "no stop condition is defined"),
            ),
        ),
    )
    total = round(sum(item.weighted_score for item in dimensions), 2)
    vetoes = _research_vetoes(profile)
    if vetoes:
        total = min(total, 54.0)
    action = _research_action(total)
    strengths = tuple(
        f"{item.name}: {', '.join(item.evidence) or 'above the bucket average'}"
        for item in dimensions
        if item.raw_score >= 70
    )[:5]
    position = _position_size(total, profile, vetoes)
    return ResearchScore(total, action, dimensions, strengths, tuple(vetoes), position)


def assess_market(
    *,
    as_of: str,
    data_date: str | None,
    regime: str,
    max_stale_days: int = 5,
) -> MarketSnapshot:
    """Apply the source market freshness and new-long gate."""

    target = date.fromisoformat(as_of)
    normalized = regime.strip().lower()
    reasons: list[str] = []
    if not data_date:
        return MarketSnapshot(
            as_of, None, "MISSING", normalized, 0.0, False,
            ("market data is missing; new long risk is frozen",),
        )
    observed = date.fromisoformat(data_date)
    age = (target - observed).days
    reasons.append(f"market data is {data_date}; regime is {normalized}")
    if age < 0:
        reasons.append("market data is dated after the evaluation date")
        return MarketSnapshot(as_of, data_date, "INVALID", normalized, 0.0, False, tuple(reasons))
    if age > max_stale_days:
        reasons.append(f"market data is {age} days old; freshness limit is {max_stale_days} days")
        return MarketSnapshot(as_of, data_date, "STALE", normalized, 0.0, False, tuple(reasons))
    caps = {"risk_on": 70.0, "neutral": 40.0, "risk_off": 30.0}
    allowed = normalized in {"risk_on", "neutral"}
    if not allowed:
        reasons.append("risk_off or unknown regime blocks new long risk")
    return MarketSnapshot(
        as_of, data_date, "FRESH", normalized, caps.get(normalized, 0.0), allowed, tuple(reasons)
    )


def evaluate_case(
    profile: ResearchProfile,
    entry: EntryEvidence,
    market: MarketSnapshot,
) -> WorkbenchResult:
    """Combine research, timing evidence, and risk gates for human review."""

    research = score_research(profile)
    blockers = list(research.vetoes)
    if market.data_status != "FRESH":
        blockers.append("market data is not fresh")
    elif not market.new_long_allowed:
        blockers.append(f"market regime {market.regime} blocks new long risk")
    if entry.score < 4:
        blockers.append("entry evidence is below the watch threshold")

    if research.action == "AVOID":
        action = "AVOID"
    elif blockers:
        action = "BLOCKED"
    elif research.total_score < 70 or entry.score < 6:
        action = "WATCH"
    else:
        action = "CANDIDATE"

    if action == "CANDIDATE":
        multiplier = 1.0 if entry.score >= 8 else 0.5
        position = min(research.suggested_position_pct * multiplier, market.position_cap_pct)
    else:
        position = 0.0

    reasons = list(research.strengths[:3])
    reasons.append(f"entry evidence score: {entry.score} ({entry.state})")
    review_steps = (
        "confirm the evidence date and market freshness",
        "check the invalidation condition and maximum loss",
        "record the human decision; this workbench never submits an order",
    )
    return WorkbenchResult(
        symbol=profile.symbol,
        name=profile.name,
        action=action,
        manual_review_required=True,
        research_score=research.total_score,
        research_action=research.action,
        entry_score=entry.score,
        entry_state=entry.state,
        suggested_position_pct=round(position, 2),
        market_status=market.data_status,
        market_regime=market.regime,
        reasons=tuple(reasons),
        blockers=tuple(blockers),
        review_steps=review_steps,
        dimensions=research.dimensions,
    )


def _dimension(name: str, raw: float, evidence: tuple[str, ...]) -> DimensionScore:
    weight = _DIMENSION_WEIGHTS[name]
    clean = round(_clamp(raw), 2)
    return DimensionScore(name, clean, weight, round(clean * weight, 2), evidence)


def _evidence(*items: tuple[bool, str]) -> tuple[str, ...]:
    return tuple(text for active, text in items if active)


def _research_vetoes(profile: ResearchProfile) -> list[str]:
    vetoes: list[str] = []
    if profile.revenue_growth < 30 and profile.gross_margin_trend < 35:
        vetoes.append("financial validation is weak")
    if profile.liquidity_score < 25:
        vetoes.append("liquidity is below the minimum")
    if profile.price_in_risk > 88 and profile.profit_taking_pressure > 75:
        vetoes.append("price-in-risk and profit-taking pressure are both high")
    if not profile.stop_loss_ready:
        vetoes.append("no stop condition is defined")
    return vetoes


def _research_action(total: float) -> str:
    if total >= 85:
        return "STRONG_WATCH"
    if total >= 70:
        return "WATCH"
    if total >= 55:
        return "OBSERVE"
    if total >= 40:
        return "CAUTIOUS"
    return "AVOID"


def _position_size(total: float, profile: ResearchProfile, vetoes: list[str]) -> float:
    if vetoes or total < 55:
        return 0.0
    if total >= 85:
        base = 5.0
    elif total >= 70:
        base = 3.0
    else:
        base = 1.0
    if profile.price_in_risk >= 70:
        base -= 1.0
    if profile.profit_taking_pressure >= 70:
        base -= 1.0
    return max(0.0, min(base, 5.0))


def sample_cases() -> list[tuple[ResearchProfile, EntryEvidence, MarketSnapshot]]:
    """Return fully synthetic cases that expose candidate, stale, and veto paths."""

    strong = dict(
        demand_rigidity=90,
        supply_shortage=84,
        capex_confirmation=88,
        pricing_power=82,
        early_signal_strength=78,
        kol_heat=58,
        sell_side_lag=42,
        price_in_risk=45,
        macro_tailwind=72,
        policy_support=65,
        liquidity_score=76,
        revenue_growth=82,
        gross_margin_trend=78,
        peg_reasonable=64,
        chip_concentration=68,
        profit_taking_pressure=42,
        overhead_supply=36,
        cross_market_confirmation=78,
        relative_strength=81,
        drawdown_from_high=8,
        stop_loss_ready=True,
        thesis="Synthetic infrastructure demand with independently stated invalidation rules.",
    )
    fresh = assess_market(as_of="2026-08-21", data_date="2026-08-20", regime="neutral")
    stale = assess_market(as_of="2026-08-21", data_date="2026-08-10", regime="neutral")
    blocked_profile = ResearchProfile(
        symbol="DEMO-C",
        name="Synthetic Risk Case",
        **{**strong, "price_in_risk": 94, "profit_taking_pressure": 86, "stop_loss_ready": False},
    )
    return [
        (
            ResearchProfile(symbol="DEMO-A", name="Synthetic Core", **strong),
            EntryEvidence(True, True, True, True, True),
            fresh,
        ),
        (
            ResearchProfile(symbol="DEMO-B", name="Synthetic Stale", **strong),
            EntryEvidence(True, True, True, True, True),
            stale,
        ),
        (
            blocked_profile,
            EntryEvidence(True, True, True, True, True),
            fresh,
        ),
    ]


def build_demo_payload() -> dict[str, Any]:
    results = [evaluate_case(*case).to_dict() for case in sample_cases()]
    return {
        "title": "Axe Bobby Offline Research Workbench",
        "data_mode": "SYNTHETIC_ONLY",
        "automatic_trading": False,
        "results": results,
    }


def main() -> None:
    print(json.dumps(build_demo_payload(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
