import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Subscription } from '../firebase/types';
import { convertCurrency } from '@/utils/currency';
import { sanitizeAiPrompt } from '@/utils/securitySanitizer';

export interface ScannedSubscription {
  name?: string;
  amount?: number;
  currency?: string;
  billingCycle?: 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'yearly' | 'biennially';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const RECEIPT_ANALYSIS_TIMEOUT_MS = 35_000;
// Pin a stable model instead of using the moving `*-latest` alias.
const GEMINI_MODEL = 'gemini-3.6-flash';

export const analyzeReceiptImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<ScannedSubscription | null> => {
  try {
    const secretDoc = await getDoc(doc(db, 'config', 'secrets'));
    if (!secretDoc.exists()) {
      throw new Error('Secret config not found');
    }
    
    const GEMINI_API_KEY = secretDoc.data().GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('API key missing in config');
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const promptText = `
      Analyze this receipt or invoice image and extract the subscription details.
      Return ONLY a raw, valid JSON object with no markdown formatting and no backticks.
      The JSON must match this structure exactly:
      {
        "name": "Extracted brand or service name (string)",
        "amount": Extracted total amount (number, decimals allowed),
        "currency": "Extracted 3-letter currency code (e.g., USD, TRY, EUR)",
        "billingCycle": "Guess the cycle based on context. Must be one of: 'weekly', 'monthly', 'quarterly', 'biannually', 'yearly', 'biennially'. Default to 'monthly'."
      }
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RECEIPT_ANALYSIS_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini receipt scan returned an error:', response.status, errText);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!cleanedText) {
      return null;
    }

    const parsedJson = JSON.parse(cleanedText) as ScannedSubscription;
    return parsedJson;

  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.warn(
      isTimeout
        ? 'Gemini receipt scan timed out; the user can retry with a clearer image.'
        : 'Gemini receipt scan could not be completed.',
      error
    );
    return null;
  }
};

/**
 * AI Advisor Chat Assistant powered by Gemini API
 */
export async function chatWithSubmateAi(
  userMessage: string,
  history: ChatMessage[],
  subscriptions: Subscription[],
  baseCurrency: string = 'TRY',
  isTurkish: boolean = true
): Promise<string> {
  try {
    // Construct rich portfolio context
    const activeSubs = subscriptions.filter(s => s.status !== 'paused');
    let totalMonthly = 0;
    const subSummaries = activeSubs.map(s => {
      const converted = convertCurrency(s.amount, s.currency || 'TRY', baseCurrency);
      totalMonthly += converted;
      return `- ${s.name}: ${s.amount} ${s.currency || 'TRY'} (${s.billingCycle || 'monthly'}) [Category: ${s.category || 'General'}]`;
    }).join('\n');

    const systemPrompt = `
Sen SubMate yapay zekâ finans danışmanısın. Kullanıcı ile sıcak, doğal, samimi ve uzman bir dille konuş.
Asla mekanik, robotik veya kalıplaşmış şirket dili kullanma. Gerçek bir kişisel finans uzmanı gibi çözüm odaklı ol.

Kullanıcının Mevcut Abonelik Portföyü:
- Para Birimi: ${baseCurrency}
- Aktif Abonelik Sayısı: ${activeSubs.length}
- Tahmini Toplam Aylık Harcama: ~${totalMonthly.toFixed(2)} ${baseCurrency}
- Aktif Abonelik Listesi:
${subSummaries || 'Henüz kaydedilmiş aktif abonelik yok.'}

Yanıt Kuralları:
1. Soruyu soranın dilinde yanıt ver (Varsayılan: ${isTurkish ? 'Türkçe' : 'İngilizce'}).
2. Kullanıcının sorusunu doğrudan yanıtla; genel karşılama veya portföy özeti ile kaçamak yapma.
3. Uygunsa başta kısa bir sonuç, ardından en fazla üç kısa madde ve net bir sonraki adım ver.
4. Portföyde olmayan fiyat, kampanya veya abonelik bilgilerini biliyormuş gibi davranma; belirsizse açıkça belirt.
5. Robotik tekrarlar ve gereksiz selamlamalardan kaçın.
`;

    // Attempt Gemini call
    const secretDoc = await getDoc(doc(db, 'config', 'secrets')).catch(() => null);
    const GEMINI_API_KEY = secretDoc && secretDoc.exists() ? secretDoc.data()?.GEMINI_API_KEY : null;

    if (GEMINI_API_KEY) {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      const safeUserMessage = sanitizeAiPrompt(userMessage);

      // The welcome text is local UI content. Sending it as a model turn makes the
      // conversation invalid because Gemini conversations must begin with the user.
      const visibleHistory = history.filter(msg => !msg.id.startsWith('welcome-'));
      const lastMessage = visibleHistory[visibleHistory.length - 1];
      const priorMessages = lastMessage?.sender === 'user' && lastMessage.text.trim() === userMessage.trim()
        ? visibleHistory.slice(0, -1)
        : visibleHistory;

      const contentsHistory = priorMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: sanitizeAiPrompt(msg.text) }]
      }));

      contentsHistory.push({
        role: 'user',
        parts: [{ text: safeUserMessage }]
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let response: Response;
      try {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: contentsHistory,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        const resData = await response.json();
        const aiText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) return aiText.trim();
      }

      console.warn('[SubMate AI Chat] Gemini API returned an error:', response.status);
    }
  } catch (err) {
    console.warn('[SubMate AI Chat] Gemini API fallback triggered:', err);
  }

  // Fallback intelligent offline engine responses
  return generateOfflineSmartAiResponse(userMessage, subscriptions, baseCurrency, isTurkish);
}

function generateOfflineSmartAiResponse(
  query: string,
  subscriptions: Subscription[],
  baseCurrency: string,
  isTurkish: boolean
): string {
  const q = query.toLowerCase();
  const activeSubs = subscriptions.filter(s => s.status !== 'paused');
  const activeCount = activeSubs.length;

  let totalMonthly = 0;
  activeSubs.forEach(s => {
    totalMonthly += convertCurrency(s.amount || 0, s.currency || 'TRY', baseCurrency);
  });

  if (q.includes('netflix') && q.includes('disney')) {
    if (isTurkish) {
      return `**Kısa cevap:** İzleme alışkanlığına göre tek bir platform seçip diğerini şimdilik alma; ikisini aynı anda açmak yerine dönüşümlü kullanmak bütçeyi korur.\n\n` +
        `• **Netflix:** Çeşitli dizi/film seçkisi ve farklı türleri denemek istiyorsan daha uygun.\n` +
        `• **Disney+:** Marvel, Star Wars, Pixar ve Disney içerikleri senin için öncelikliyse daha doğru seçim.\n\n` +
        `**Önerim:** Bu ay en çok izleyeceğin kataloğu seç, bir ay sonra memnuniyetini değerlendir. Böylece aynı anda iki yayın aboneliğine ödemezsin.`;
    }
    return `**Short answer:** Pick one service for now and rotate later instead of paying for both at once.\n\n` +
      `• **Netflix:** A stronger fit for a broad mix of series and films.\n` +
      `• **Disney+:** A stronger fit if Marvel, Star Wars, Pixar, and Disney are your priorities.\n\n` +
      `**My suggestion:** Choose the catalogue you will use most this month, then reassess in a month.`;
  }

  if (q.includes('tasarruf') || q.includes('save') || q.includes('bütçe') || q.includes('nereden')) {
    if (isTurkish) {
      return `Bütçeni detaylıca inceledim! 🚀 Şu an toplam ${activeCount} aktif aboneliğe aylık yaklaşık **${totalMonthly.toFixed(0)} ${baseCurrency}** harcıyorsun.\n\n` +
        `İşte bütçeni anında rahatlatacak en etkili 3 adım:\n\n` +
        `1️⃣ **Yayın Servisi Rotasyonu:** Netflix, Disney+ ve Prime'ı aynı anda ödemek yerine her ay sadece 1 tanesini izleyip diğerlerini duraklatabilirsin.\n` +
        `2️⃣ **Ortak / Aile Paketleri:** Spotify veya YouTube Premium'u aile paketine taşıyarak kişi başı gideri %70 azaltabilirsin.\n` +
        `3️⃣ **Yıllık İndirim Fırsatı:** Vazgeçilmez dijital araçlarını yıllık plana geçirerek yılda 2 ayı bedavaya getirebilirsin.`;
    }
    return `I analyzed your portfolio! 🚀 You currently spend around **${totalMonthly.toFixed(0)} ${baseCurrency}/mo** across ${activeCount} subscriptions.\n\n` +
      `Here are 3 smart actions to boost your savings:\n\n` +
      `1️⃣ **Rotate Streaming:** Switch streaming apps month-by-month instead of keeping all active.\n` +
      `2️⃣ **Family Plans:** Upgrade Spotify or YouTube to Family plans to save up to 70% per person.\n` +
      `3️⃣ **Annual Discount:** Switch non-negotiable tools to annual billing to get ~2 months free.`;
  }

  if (q.includes('spotify') || q.includes('apple music') || q.includes('karşılaştır') || q.includes('compare')) {
    if (isTurkish) {
      return `Çok popüler iki müzik devini senin için karşılaştırdım! 🎵\n\n` +
        `• **Spotify:** Müzik keşif algoritmaları, Haftalık Keşif listeleri ve cihazlar arası kesintisiz geçişte bir numara.\n` +
        `• **Apple Music:** Ekstra ücret ödemeden Stüdyo kalitesinde Hi-Fi Lossless ses ve Spatial Audio sunar.\n\n` +
        `💡 **Tavsiyem:** Eğer Apple Ekosistemi (iPhone, Mac, Apple Watch) kullanıyorsan **Apple One** paketi ile hem müzik hem depolamayı çok daha uyguna getirebilirsin!`;
    }
    return `Here is a side-by-side breakdown of Spotify vs Apple Music! 🎵\n\n` +
      `• **Spotify:** Best-in-class personalized recommendation algorithms and cross-platform playback.\n` +
      `• **Apple Music:** Free Lossless Hi-Fi Audio and Spatial Audio included out of the box.\n\n` +
      `💡 **Pro-tip:** If you use Apple devices, the Apple One bundle offers Apple Music + iCloud storage for much less!`;
  }

  if (isTurkish) {
    return `Harika! Bütçeni incelediğimde ${activeCount} aktif aboneliğin olduğunu görüyorum. ` +
      `Aboneliklerini duraklatma, daha uygun alternatif bulma veya aile paketine geçme konusunda bana aklına takılan her şeyi sorabilirsin! 😊`;
  }

  return `Great to assist you! I analyzed your ${activeCount} active subscriptions. ` +
    `Ask me anything about switching to family plans, pausing unused tools, or finding cheaper alternatives! 😊`;
}
