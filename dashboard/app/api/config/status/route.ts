import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('bot_config')
            .select('updated_at, system_instructions')
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const preview = data?.system_instructions ? data.system_instructions.substring(0, 120) : null

        return NextResponse.json({
            last_updated_at: data?.updated_at || null,
            instruction_preview: preview
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
