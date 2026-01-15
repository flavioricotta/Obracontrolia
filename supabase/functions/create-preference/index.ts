
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { items, payer } = await req.json()
        const accessToken = Deno.env.get('MP_ACCESS_TOKEN')

        if (!accessToken) {
            throw new Error('Missing MP_ACCESS_TOKEN')
        }

        const preferenceData = {
            items: items.map((item: any) => ({
                title: item.title,
                quantity: Number(item.quantity),
                currency_id: 'BRL',
                unit_price: Number(item.unit_price)
            })),
            payer: {
                email: payer.email,
                name: payer.name
            },
            back_urls: {
                success: "https://obracontrol.com.br/success",
                failure: "https://obracontrol.com.br/failure",
                pending: "https://obracontrol.com.br/pending"
            },
            auto_return: "approved"
        }

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferenceData)
        })

        const data = await response.json()

        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
