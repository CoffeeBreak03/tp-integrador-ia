#!/bin/bash

# Vision endpoint test
curl -X POST http://localhost:8888/.netlify/functions/vision \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'

# Translate endpoint test
curl -X POST http://localhost:8888/.netlify/functions/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "こんにちは、これは漫画です"}'

# Full pipeline test
curl -X POST http://localhost:8888/.netlify/functions/process \
  -H "Content-Type: application/json" \
  -d @payload.json
