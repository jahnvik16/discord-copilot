'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function updateSystemInstructions(instructions: string) {
    // Update the first row, or insert if empty (though bot setup assumes 1 row)
    // We'll try to update ID 1 or the first found row.

    // First, check if a config exists
    const { data: existing } = await supabase.from('bot_config').select('id').limit(1).single()

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from('bot_config')
            .update({
                system_instructions: instructions,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('bot_config')
            .insert({
                system_instructions: instructions,
                discord_channel_id: 'UNKNOWN_PLEASE_UPDATE',
                updated_at: new Date().toISOString()
            })
        error = insertError;
    }

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function getSystemInstructions() {
    const { data, error } = await supabase.from('bot_config').select('system_instructions').limit(1).single()
    if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
        return ""
    }
    return data?.system_instructions || ""
}

export async function resetMemory() {
    const { error } = await supabase.from('chat_memory').delete().neq('id', 0)
    if (error) throw new Error(error.message)
    return { success: true }
}

export async function updateAllowedChannel(channelId: string) {
    const { data: existing } = await supabase.from('bot_config').select('id').limit(1).single()

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from('bot_config')
            .update({ discord_channel_id: channelId })
            .eq('id', existing.id)
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('bot_config')
            .insert({ discord_channel_id: channelId })
        error = insertError;
    }

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function getBotConfig() {
    const { data, error } = await supabase.from('bot_config').select('*').limit(1).single()
    if (error && error.code !== 'PGRST116') {
        return null
    }
    return data
}
