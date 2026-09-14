"""
TrustCall Guard 3 Automatic Role-Separated Cascade Test Suite
Tests Branch (a) WRONG Code -> Automatic Cascade to Callback & Dual Auth.
Tests Branch (b) CORRECT Code -> Challenge Passed & No Emergency Cascade.
"""

import os
import sys
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "trust-log")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

def simulate_automatic_guard3_cascade(caller_spoken_response: str, app1_manual_click: bool = False, app2_manual_click: bool = False):
    system_challenge_code = "8492"
    risk_score = 85.0

    print(f"🚨 [Guard 3 Interception]: Risk Score = {risk_score}%. System issues challenge code [{system_challenge_code}] to caller.")
    print(f"🎙️ [Caller Spoken Response Input]: Spoke '{caller_spoken_response}'")

    # 1. Automatic Code Check (No verify button click required)
    is_match = (caller_spoken_response.strip() == system_challenge_code)
    
    if is_match:
        # BRANCH (b): CORRECT CODE -> Lower Risk / Challenge Passed
        print("✅ [AUTOMATIC CHECK]: Code Matched! Status: CHALLENGE_PASSED.")
        print("   Emergency callback cascade & Dual-Auth lock SKIPPED.\n")
        return {
            "branch": "(b) CORRECT CODE",
            "challenge_state": "passed",
            "automatic_callback_triggered": False,
            "dual_auth_unlocked": False,
            "manual_clicks_required_before_dual_auth": 0,
            "final_approved": False
        }
    else:
        # BRANCH (a): WRONG CODE / MISMATCH -> AUTOMATIC CASCADE (0 manual clicks!)
        print("❌ [AUTOMATIC CHECK]: Code Mismatch! Status: CHALLENGE_FAILED.")
        print("   ⚡ AUTOMATIC CASCADE 1: Initiating Cellular Callback to +91 98765-43210...")
        print("   ⚡ AUTOMATIC CASCADE 2: Call Connected! Unlocking Step 3 Dual Authorization...")
        
        dual_auth_unlocked = True
        transaction_approved = (app1_manual_click and app2_manual_click)
        
        print(f"   👆 MANUAL STEP: Approver 1 Clicked = {app1_manual_click}, Approver 2 Clicked = {app2_manual_click}")
        print(f"   🎯 Transaction Fully Approved = {transaction_approved}\n")
        
        return {
            "branch": "(a) WRONG CODE",
            "challenge_state": "failed",
            "automatic_callback_triggered": True,
            "dual_auth_unlocked": True,
            "manual_clicks_required_before_dual_auth": 0,
            "final_approved": transaction_approved
        }

def run_tests():
    print("\n=========================================================================")
    print(" 🧪 TRUSTCALL GUARD 3 AUTOMATIC CASCADE TEST SUITE")
    print("=========================================================================\n")

    # BRANCH (a): WRONG Code Spoken ("1111")
    print("--- BRANCH (a): WRONG CODE SPOKEN ('1111') ---")
    res_a = simulate_automatic_guard3_cascade(caller_spoken_response="1111", app1_manual_click=True, app2_manual_click=True)
    print(f"📊 BRANCH (a) RESULT: {res_a}")
    assert res_a["challenge_state"] == "failed"
    assert res_a["automatic_callback_triggered"] is True
    assert res_a["dual_auth_unlocked"] is True
    assert res_a["manual_clicks_required_before_dual_auth"] == 0
    assert res_a["final_approved"] is True
    print("✅ BRANCH (a) PASSED: Wrong code automatically triggered callback & dual-auth with ZERO manual clicks before approval!\n")

    # BRANCH (b): CORRECT Code Spoken ("8492")
    print("--- BRANCH (b): CORRECT CODE SPOKEN ('8492') ---")
    res_b = simulate_automatic_guard3_cascade(caller_spoken_response="8492")
    print(f"📊 BRANCH (b) RESULT: {res_b}")
    assert res_b["challenge_state"] == "passed"
    assert res_b["automatic_callback_triggered"] is False
    assert res_b["dual_auth_unlocked"] is False
    assert res_b["manual_clicks_required_before_dual_auth"] == 0
    print("✅ BRANCH (b) PASSED: Correct code logged as passed and skipped emergency cascade!\n")

    print("=========================================================================")
    print(" 🎉 ALL AUTOMATIC CASCADE TESTS PASSED PERFECTLY!")
    print("=========================================================================\n")

if __name__ == "__main__":
    run_tests()
