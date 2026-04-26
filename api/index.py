"""
Vercel Serverless Function Entry Point
Wraps the FastAPI app for Vercel serverless deployment
"""
import sys
import os

# Add backend to path so we can import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from server import app

# Vercel handles FastAPI apps automatically if 'app' is exported.
# Mangum is not required for Vercel's Python runtime.

