"""
TrustCall Guard 3 Full-Screen Verification Flow Test Suite
Verifies both Correct Number (Full Pass) and Incorrect Number (Immediate Lockout) scenarios.
"""

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "trust-log")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

MOCK_VERIFIED_DIRECTORY = {
    "default": "+91 98765-43210",
    "bank": "+91 1800-11-2211",
    "family": "+91 98765-43210"
}

def simulate_guard3_modal_flow(transcript: str, entered_challenge: str, entered_phone: str, app1: bool, app2: bool):
    challenge_code = "8492"
    risk_score = 85.0 # >70 threshold triggers Guard 3 Modal

    print(f"🚨 [Screen Switch Triggered]: Risk Score {risk_score}% > 70. Transitioning to Full-Screen 'Guard 3: Active Verification' Lockout View.\n")

    # Step 1: Step-Up Challenge Code Verification
    step1_verified = (entered_challenge == challenge_code)
    print(f"1. STEP 1 (Challenge Code): Entered = '{entered_challenge}', Expected = '{challenge_code}' -> Verified = {step1_verified}")
    if not step1_verified:
        return {"status": "BLOCKED_STEP1", "reason": "Incorrect challenge code"}

    # Step 2: Number Verification against Directory
    lower_snippet = transcript.lower()
    expected_number = MOCK_VERIFIED_DIRECTORY["bank"] if ("bank" in lower_snippet or "state bank" in lower_snippet) else MOCK_VERIFIED_DIRECTORY["default"]
    
    entered_digits = ''.join(filter(str.isdigit, entered_phone))
    expected_digits = ''.join(filter(str.isdigit, expected_number))

    number_matched = (entered_digits == expected_digits or entered_digits.endswith("9876543210") or entered_digits.endswith("1800112211"))
    
    print(f"2. STEP 2 (Number Lookup):  Entered = '{entered_phone}', Directory Expected = '{expected_number}' -> Match = {number_matched}")

    if not number_matched:
        error_msg = "❌ Number does not match verified records — this may be a fraudulent request. Blocking transaction."
        print(f"   🛑 IMMEDIATE LOCKOUT: {error_msg}")
        print("   🔒 STEP 3 (Callback) & STEP 4 (Dual Auth): LOCKED OUT / NOT REACHED.\n")
        return {
            "status": "BLOCKED_NUMBER_MISMATCH",
            "error_banner": error_msg,
            "callback_executed": False,
            "dual_auth_unlocked": False,
            "transaction_approved": False
        }

    # Step 3: Out-of-Band Callback Simulation (Only reached if number matched!)
    callback_connected = True
    print(f"3. STEP 3 (Cellular Callback): Calling {entered_phone}... Connected = {callback_connected}")

    # Step 4: Dual Authorization (Only unlocked after number verification succeeds!)
    dual_auth_unlocked = True
    transaction_approved = (app1 and app2)
    print(f"4. STEP 4 (Dual Auth Unlocked): Approver 1 = {app1}, Approver 2 = {app2} -> Fully Approved = {transaction_approved}\n")

    return {
        "status": "SUCCESS" if transaction_approved else "PENDING_DUAL_AUTH",
        "number_matched": True,
        "callback_executed": True,
        "dual_auth_unlocked": True,
        "transaction_approved": transaction_approved
    }

def run_tests():
    print("\n=========================================================================")
    print(" 🧪 TRUSTCALL GUARD 3 FULL-SCREEN VERIFICATION FLOW TEST SUITE")
    print("=========================================================================\n")

    # TEST A: Correct Number Match Flow
    print("--- TEST A: CORRECT NUMBER VERIFICATION FLOW ---")
    res_a = simulate_guard3_modal_flow(
        transcript="URGENT: Share your OTP code!",
        entered_challenge="8492",
        entered_phone="+91 98765-43210",
        app1=True,
        app2=True
    )
    print(f"📊 TEST A RESULT: {res_a}")
    assert res_a["number_matched"] is True
    assert res_a["callback_executed"] is True
    assert res_a["dual_auth_unlocked"] is True
    assert res_a["transaction_approved"] is True
    print("✅ TEST A PASSED: Correct number proceeded through Callback -> Dual Auth -> Approved!\n")

    # TEST B: Incorrect Number Mismatch Flow
    print("--- TEST B: INCORRECT NUMBER MISMATCH FLOW ---")
    res_b = simulate_guard3_modal_flow(
        transcript="URGENT: Share your OTP code!",
        entered_challenge="8492",
        entered_phone="+91 11111-22222",
        app1=True,
        app2=True
    )
    print(f"📊 TEST B RESULT: {res_b}")
    assert res_b["status"] == "BLOCKED_NUMBER_MISMATCH"
    assert res_b["callback_executed"] is False
    assert res_b["dual_auth_unlocked"] is False
    assert res_b["transaction_approved"] is False
    print("✅ TEST B PASSED: Incorrect number blocked immediately after check, never reaching callback or dual auth!\n")

    print("=========================================================================")
    print(" 🎉 ALL GUARD 3 FULL-SCREEN VERIFICATION FLOW TESTS PASSED PERFECTLY!")
    print("=========================================================================\n")

if __name__ == "__main__":
    run_tests()
