import { NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, ...context } = body;

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const answer = await generateChatResponse(context, question);
    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate chat response' },
      { status: 500 }
    );
  }
}
