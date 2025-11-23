#!/bin/bash
# Script de deployment para Red Estudiantil PWA

echo "🚀 Desplegando Red Estudiantil PWA"
echo ""

echo "📦 Paso 1: Instalando dependencias..."
npm install

echo ""
echo "🔨 Paso 2: Build de producción..."
npm run build

echo ""
echo "✅ Build completado!"
echo ""
echo "📝 Próximos pasos manuales:"
echo ""
echo "1️⃣  Desplegar Edge Function a Supabase:"
echo "    npx supabase functions deploy push-notification"
echo ""
echo "2️⃣  Desplegar a Vercel:"
echo "    git add ."
echo "    git commit -m 'feat: Add teacher name to notifications and PWA install'"
echo "    git push origin main"
echo ""
echo "3️⃣  Probar en producción:"
echo "    https://red-estudiantil-pwa.vercel.app"
echo ""
echo "🎉 ¡Listo para desplegar!"
