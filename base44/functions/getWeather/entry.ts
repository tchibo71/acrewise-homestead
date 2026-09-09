import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const body = await req.json();
    const { latitude, longitude, request_type } = body;

    if (latitude == null || longitude == null) {
      return Response.json({ error: 'latitude and longitude are required' }, { status: 400 });
    }

    const apiKey = secrets.get("TOMORROW_IO_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'Weather API key not configured' }, { status: 500 });
    }

    const location = `${latitude},${longitude}`;

    if (request_type === 'current') {
      const url = `https://api.tomorrow.io/v4/weather/realtime?location=${location}&apikey=${apiKey}&units=imperial`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return Response.json({ error: errorData.message || 'Failed to fetch current weather' }, { status: response.status });
      }
      const data = await response.json();
      return Response.json({ data: data.data });
    }

    if (request_type === 'forecast') {
      const url = `https://api.tomorrow.io/v4/weather/forecast?location=${location}&timesteps=1d,1h&units=imperial&apikey=${apiKey}`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return Response.json({ error: errorData.message || 'Failed to fetch forecast' }, { status: response.status });
      }
      const data = await response.json();
      return Response.json({ timelines: data.timelines });
    }

    return Response.json({ error: 'request_type must be "current" or "forecast"' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}