import unittest

from workbench import (
    ResearchProfile,
    assess_market,
    build_demo_payload,
    evaluate_case,
    sample_cases,
    score_research,
)


class ResearchWorkbenchTest(unittest.TestCase):
    def test_score_exposes_all_seven_buckets(self):
        profile, _, _ = sample_cases()[0]
        result = score_research(profile)
        self.assertEqual(len(result.dimensions), 7)
        self.assertGreater(result.total_score, 70)
        self.assertEqual(result.vetoes, ())

    def test_fresh_strong_case_requires_human_review(self):
        result = evaluate_case(*sample_cases()[0])
        self.assertEqual(result.action, "CANDIDATE")
        self.assertTrue(result.manual_review_required)
        self.assertGreater(result.suggested_position_pct, 0)
        self.assertIn("confirm the evidence date", result.review_steps[0])

    def test_stale_market_freezes_new_long_risk(self):
        result = evaluate_case(*sample_cases()[1])
        self.assertEqual(result.action, "BLOCKED")
        self.assertEqual(result.market_status, "STALE")
        self.assertEqual(result.suggested_position_pct, 0)
        self.assertIn("market data is not fresh", result.blockers)

    def test_research_veto_fails_closed(self):
        result = evaluate_case(*sample_cases()[2])
        self.assertEqual(result.action, "BLOCKED")
        self.assertEqual(result.suggested_position_pct, 0)
        self.assertIn("no stop condition is defined", result.blockers)
        self.assertIn("price-in-risk and profit-taking pressure are both high", result.blockers)

    def test_future_market_date_is_invalid_and_blocks(self):
        market = assess_market(
            as_of="2026-08-21", data_date="2026-08-22", regime="neutral"
        )
        self.assertEqual(market.data_status, "INVALID")
        self.assertFalse(market.new_long_allowed)
        self.assertEqual(market.position_cap_pct, 0)

    def test_non_finite_score_input_is_rejected(self):
        profile, _, _ = sample_cases()[0]
        invalid = ResearchProfile(
            **{**profile.__dict__, "liquidity_score": float("nan")}
        )
        with self.assertRaises(ValueError):
            score_research(invalid)

    def test_demo_payload_is_synthetic_and_deterministic(self):
        first = build_demo_payload()
        second = build_demo_payload()
        self.assertEqual(first, second)
        self.assertEqual(first["data_mode"], "SYNTHETIC_ONLY")
        self.assertFalse(first["automatic_trading"])
        self.assertEqual([row["action"] for row in first["results"]], ["CANDIDATE", "BLOCKED", "BLOCKED"])


if __name__ == "__main__":
    unittest.main()
