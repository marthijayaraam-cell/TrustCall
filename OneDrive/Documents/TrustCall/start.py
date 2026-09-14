"""
TrustCall Startup Launcher
Run this script to start the TrustCall FastAPI Backend Server.
"""

import sys
import os
import uvicorn

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "trust-log")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

if __name__ == "__main__":
    print("=================================================================")
    print(" 🛡️  STARTING TRUSTCALL BACKEND ENGINE (FastAPI)                ")
    print("=================================================================")
    print(" API Base URL:  http://localhost:8000")
    print(" Swagger Docs:  http://localhost:8000/docs")
    print(" CORS Support:  Enabled for React Frontend (http://localhost:5173)")
    print(" Security:      5-Layer Defense-in-Depth Active")
    print("=================================================================\n")
    
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
