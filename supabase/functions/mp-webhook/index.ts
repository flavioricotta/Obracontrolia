
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const url = new URL(req.url)
        const topic = url.searchParams.get('topic') || url.searchParams.get('type')
        const id = url.searchParams.get('id') || url.searchParams.get('data.id')

        if (topic === 'payment' && id) {
            const accessToken = Deno.env.get('MP_ACCESS_TOKEN')

            // Verify payment status with Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            const paymentData = await mpResponse.json()

            if (paymentData.status === 'approved') {
                // Log the order or update secure database
                console.log('Payment approved:', id)

                // Example: Insert into 'orders' table
                /*
                await supabase.from('orders').insert({
                    payment_id: id,
                    status: 'paid',
                    amount: paymentData.transaction_amount,
                    metadata: paymentData.metadata
                })
                */
            }
        }

        return new Response(
            JSON.stringify({ received: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
