import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE() {
    try {
        const { error } = await supabase.from('chat_memory').delete().neq('id', 0)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
