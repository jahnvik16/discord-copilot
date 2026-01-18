import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
// @ts-ignore
// @ts-ignore
const PDFParser = require('pdf2json');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Parse PDF using pdf2json
        const pdfParser = new PDFParser(null, 1); // 1 = text only

        const text: string = await new Promise((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
            pdfParser.on("pdfParser_dataReady", () => {
                resolve(pdfParser.getRawTextContent());
            });
            pdfParser.parseBuffer(buffer);
        });

        if (!text) {
            return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500 })
        }

        // Chunk text (simple chunking)
        const chunkSize = 1000
        const chunks = []
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize))
        }

        // Setup Embedding Model
        const model = genai.getGenerativeModel({ model: "models/text-embedding-004" });

        let count = 0;
        // Process chunks
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            // Generate embedding
            const result = await model.embedContent(chunk)
            const embedding = result.embedding.values

            // Insert into Supabase
            const { error } = await supabase.from('knowledge_base').insert({
                content: chunk,
                embedding: embedding
            })

            if (error) {
                console.error('Supabase Insert Error:', error)
                // Continue but log error? Or fail? Let's verify specifically.
                // If error is about vector dimension, user handles schema.
            } else {
                count++;
            }
        }

        return NextResponse.json({ success: true, chunksProcessed: count })
    } catch (error: any) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
