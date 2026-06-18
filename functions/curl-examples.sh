#!/bin/bash

# Vision endpoint test
curl -X POST http://localhost:3001/api/vision \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'

# Translate endpoint test
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "こんにちは、contexto: これは漫画です"}'

# Full pipeline test
curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -d @payload.json
