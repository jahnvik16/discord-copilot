import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
    try {
        const { data, error } = await supabase.from('bot_config').select('*').limit(1).single()

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ config: data || null })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { system_instructions, discord_channel_id } = body

        // Check for existing config
        const { data: existing } = await supabase.from('bot_config').select('id').limit(1).single()

        let error;
        const payload: any = { updated_at: new Date().toISOString() }

        if (system_instructions !== undefined) payload.system_instructions = system_instructions
        if (discord_channel_id !== undefined) payload.discord_channel_id = discord_channel_id

        if (existing) {
            const { error: updateError } = await supabase
                .from('bot_config')
                .update(payload)
                .eq('id', existing.id)
            error = updateError;
        } else {
            // Create new default if missing
            const insertPayload = {
                system_instructions: system_instructions || '',
                discord_channel_id: discord_channel_id || 'UNKNOWN_PLEASE_UPDATE',
                updated_at: new Date().toISOString()
            }
            const { error: insertError } = await supabase.from('bot_config').insert(insertPayload)
            error = insertError;
        }

        if (error) throw error
        return NextResponse.json({ success: true })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
