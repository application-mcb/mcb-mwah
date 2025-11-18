import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize genAI lazily to ensure env vars are loaded
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not set')
  }
  return new GoogleGenerativeAI(apiKey)
}

// Simple function to detect if text is likely Filipino
const isLikelyFilipino = (text: string): boolean => {
  const filipinoKeywords = [
    'magulang',
    'mga',
    'asignatura',
    'dokumento',
    'impormasyon',
    'talaan',
    'marka',
    'pagpaparehistro',
    'lahat',
    'paano',
    'saan',
    'kailan',
    'ano',
    'sino',
    'bakit',
  ]
  const lowerText = text.toLowerCase()
  return filipinoKeywords.some((keyword) => lowerText.includes(keyword))
}

export async function POST(request: NextRequest) {
  let text: string | undefined = undefined

  try {
    const body = await request.json()
    text = body.text

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // If text is empty or whitespace, return as is
    if (!text.trim()) {
      return NextResponse.json({ translated: text, original: text })
    }

    // Check if translation is needed (likely Filipino)
    if (!isLikelyFilipino(text)) {
      // Assume it's already in English or doesn't need translation
      return NextResponse.json({ translated: text, original: text })
    }

    // Validate API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey || apiKey.trim().length === 0) {
      console.warn('GOOGLE_GEMINI_API_KEY is not set, returning original text')
      return NextResponse.json({ translated: text, original: text })
    }

    // Use Gemini for translation
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

    const prompt = `Translate the following Filipino/Tagalog text to English. Only provide the translation, no explanations or additional text.

Text to translate: "${text}"

Translation:`

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const translated = response.text().trim()

      // Clean up the translation (remove quotes if present)
      const cleanTranslation = translated.replace(/^["']|["']$/g, '').trim()

      return NextResponse.json({
        translated: cleanTranslation || text,
        original: text,
      })
    } catch (translationError) {
      console.error('Translation error:', translationError)
      // Fallback: return original text if translation fails
      return NextResponse.json({ translated: text, original: text })
    }
  } catch (error) {
    console.error('Translate API Error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to translate text'

    // Use the text variable from outer scope if available
    // If parsing failed, text will be undefined and we return an error
    if (text !== undefined) {
      return NextResponse.json({ translated: text, original: text })
    }

    return NextResponse.json(
      { error: errorMessage, translated: '', original: '' },
      { status: 500 }
    )
  }
}

