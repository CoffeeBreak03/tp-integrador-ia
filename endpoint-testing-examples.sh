#!/bin/bash
# Ejemplos de curl para probar la integración frontend-backend
# Ejecutar con: bash endpoint-testing-examples.sh

BASE_URL="${1:-http://localhost:8888}"
ENDPOINT="${BASE_URL}/.netlify/functions/process"

echo "=== Testing Frontend-Backend Integration ==="
echo "Endpoint: $ENDPOINT"
echo ""

# Pequeña imagen PNG base64 (1x1 pixel transparent)
TINY_PNG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# ============================================================
# TEST 1: Request válido con imagen pequeña
# ============================================================
echo "TEST 1: POST con imagen válida"
echo "Sending: $TINY_PNG"
echo ""

curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\":\"$TINY_PNG\"}" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "(Error parsing JSON)"

echo ""
echo "---"
echo ""

# ============================================================
# TEST 2: Request sin imageBase64
# ============================================================
echo "TEST 2: POST sin campo imageBase64 (debe fallar)"
echo ""

curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "(Error parsing JSON)"

echo ""
echo "---"
echo ""

# ============================================================
# TEST 3: Request con imageBase64 vacío
# ============================================================
echo "TEST 3: POST con imageBase64 vacío (debe fallar)"
echo ""

curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":""}' \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "(Error parsing JSON)"

echo ""
echo "---"
echo ""

# ============================================================
# TEST 4: GET request (debe fallar - solo POST)
# ============================================================
echo "TEST 4: GET request (debe fallar - solo acepta POST)"
echo ""

curl -X GET "$ENDPOINT" \
  -w "\nStatus: %{http_code}\n" \
  | jq '.' 2>/dev/null || echo "(Error parsing JSON)"

echo ""
echo "---"
echo ""

# ============================================================
# TEST 5: Validar estructura de respuesta
# ============================================================
echo "TEST 5: Validar que respuesta tiene estructura correcta"
echo "(Esperado: array de objetos con id, box, texto_original, texto_traducido)"
echo ""

RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\":\"$TINY_PNG\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Verificar si es array
if echo "$RESPONSE" | jq -e 'type == "array"' >/dev/null 2>&1; then
  echo "✓ Response es un array"
  
  # Verificar primera entrada
  if echo "$RESPONSE" | jq -e '.[0] | has("id") and has("box") and has("texto_original") and has("texto_traducido")' >/dev/null 2>&1; then
    echo "✓ Primer elemento tiene campos requeridos"
  else
    echo "✗ Primer elemento no tiene todos los campos requeridos"
  fi
else
  echo "Response es objeto (posible envoltorio)"
  if echo "$RESPONSE" | jq -e '.data | type == "array"' >/dev/null 2>&1; then
    echo "✓ Response tiene .data como array"
  fi
fi

echo ""
echo "=== End of tests ==="
