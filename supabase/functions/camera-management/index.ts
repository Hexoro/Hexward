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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (req.method) {
      case 'GET':
        if (path === 'scan-network') {
          return await scanNetwork(req, corsHeaders)
        } else if (path === 'supported-brands') {
          return await getSupportedBrands(corsHeaders)
        } else if (path === 'cameras') {
          return await getCameras(supabaseClient, corsHeaders)
        }
        break

      case 'POST':
        if (path === 'test-camera') {
          return await testCamera(req, corsHeaders)
        } else if (path === 'add-camera') {
          return await addCamera(req, supabaseClient, corsHeaders)
        }
        break

      case 'PUT':
        if (path === 'update-status') {
          return await updateCameraStatus(req, supabaseClient, corsHeaders)
        }
        break

      case 'DELETE':
        if (path === 'delete-camera') {
          return await deleteCamera(req, supabaseClient, corsHeaders)
        }
        break
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function scanNetwork(req: Request, corsHeaders: Record<string, string>) {
  const { searchParams } = new URL(req.url)
  const baseIp = searchParams.get('baseIp') || '192.168.1'
  const startRange = parseInt(searchParams.get('startRange') || '1')
  const endRange = parseInt(searchParams.get('endRange') || '50')

  const detectedCameras = []
  const commonPorts = [554, 80, 8080, 9999]

  for (let i = startRange; i <= endRange; i++) {
    const ip = `${baseIp}.${i}`
    
    for (const port of commonPorts) {
      try {
        // Simulate camera detection - in real implementation, would ping/check ports
        const isReachable = Math.random() > 0.95 // 5% chance to simulate finding a camera
        
        if (isReachable) {
          const brands = ['Hikvision', 'Dahua', 'Axis', 'Foscam', 'Raspberry Pi']
          const randomBrand = brands[Math.floor(Math.random() * brands.length)]
          
          detectedCameras.push({
            ip: ip,
            port: port,
            brand: randomBrand,
            model: `${randomBrand} Model ${Math.floor(Math.random() * 1000)}`,
            rtsp_url: `rtsp://${ip}:${port}/stream1`,
            status: 'detected'
          })
        }
      } catch (error) {
        // Camera not reachable
      }
    }
  }

  return new Response(JSON.stringify({ cameras: detectedCameras }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getSupportedBrands(corsHeaders: Record<string, string>) {
  const brands = [
    {
      name: 'Hikvision',
      defaultPort: 554,
      rtspFormat: 'rtsp://[ip]:[port]/Streaming/Channels/101',
      authRequired: true
    },
    {
      name: 'Dahua',
      defaultPort: 554,
      rtspFormat: 'rtsp://[ip]:[port]/cam/realmonitor?channel=1&subtype=0',
      authRequired: true
    },
    {
      name: 'Axis',
      defaultPort: 554,
      rtspFormat: 'rtsp://[ip]:[port]/axis-media/media.amp',
      authRequired: true
    },
    {
      name: 'Foscam',
      defaultPort: 88,
      rtspFormat: 'rtsp://[ip]:[port]/videoMain',
      authRequired: true
    },
    {
      name: 'Raspberry Pi',
      defaultPort: 8554,
      rtspFormat: 'rtsp://[ip]:[port]/stream',
      authRequired: false
    }
  ]

  return new Response(JSON.stringify({ brands }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getCameras(supabaseClient: any, corsHeaders: Record<string, string>) {
  const { data, error } = await supabaseClient
    .from('camera_config')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ cameras: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function testCamera(req: Request, corsHeaders: Record<string, string>) {
  const { ip, port, rtsp_url } = await req.json()
  
  // Simulate camera testing
  const isWorking = Math.random() > 0.3 // 70% chance of success
  
  return new Response(JSON.stringify({ 
    success: isWorking,
    message: isWorking ? 'Camera stream accessible' : 'Failed to connect to camera stream'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function addCamera(req: Request, supabaseClient: any, corsHeaders: Record<string, string>) {
  const cameraData = await req.json()
  
  const { data, error } = await supabaseClient
    .from('camera_config')
    .insert([cameraData])
    .select()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ camera: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function updateCameraStatus(req: Request, supabaseClient: any, corsHeaders: Record<string, string>) {
  const { id, status } = await req.json()
  
  const { data, error } = await supabaseClient
    .from('camera_config')
    .update({ status })
    .eq('id', id)
    .select()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ camera: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function deleteCamera(req: Request, supabaseClient: any, corsHeaders: Record<string, string>) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Camera ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { error } = await supabaseClient
    .from('camera_config')
    .delete()
    .eq('id', id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}