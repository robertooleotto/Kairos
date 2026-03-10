// Google Calendar Integration (Replit Connector)
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getFreeBusy(calendarIds: string[], timeMin: string, timeMax: string) {
  const calendar = await getUncachableGoogleCalendarClient();
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: calendarIds.map(id => ({ id })),
    }
  });
  return res.data.calendars || {};
}

export async function getEvents(calendarId: string, timeMin: string, timeMax: string) {
  const calendar = await getUncachableGoogleCalendarClient();
  const res = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });
  return (res.data.items || []).map(ev => ({
    id: ev.id,
    summary: ev.summary || '(Senza titolo)',
    start: ev.start?.dateTime || ev.start?.date,
    end: ev.end?.dateTime || ev.end?.date,
    allDay: !ev.start?.dateTime,
    status: ev.status,
    transparency: ev.transparency,
  }));
}

export async function createEvent(calendarId: string, event: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
}) {
  const calendar = await getUncachableGoogleCalendarClient();
  const startEnd = event.allDay
    ? { start: { date: event.start }, end: { date: event.end } }
    : { start: { dateTime: event.start, timeZone: 'Europe/Rome' }, end: { dateTime: event.end, timeZone: 'Europe/Rome' } };
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description || '',
      ...startEnd,
    },
  });
  return res.data;
}

export async function updateEvent(calendarId: string, eventId: string, event: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
}) {
  const calendar = await getUncachableGoogleCalendarClient();
  const startEnd = event.allDay
    ? { start: { date: event.start }, end: { date: event.end } }
    : { start: { dateTime: event.start, timeZone: 'Europe/Rome' }, end: { dateTime: event.end, timeZone: 'Europe/Rome' } };
  const res = await calendar.events.update({
    calendarId,
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description || '',
      ...startEnd,
    },
  });
  return res.data;
}

export async function deleteEvent(calendarId: string, eventId: string) {
  const calendar = await getUncachableGoogleCalendarClient();
  await calendar.events.delete({ calendarId, eventId });
}

export async function checkAvailability(calendarIds: string[], date: string) {
  const timeMin = `${date}T00:00:00+01:00`;
  const timeMax = `${date}T23:59:59+01:00`;
  const busyData = await getFreeBusy(calendarIds, timeMin, timeMax);
  
  const result: Record<string, { available: boolean; busySlots: Array<{ start: string; end: string }> }> = {};
  
  for (const calId of calendarIds) {
    const calBusy = (busyData as any)[calId];
    const busySlots = calBusy?.busy || [];
    const errors = calBusy?.errors || [];
    result[calId] = {
      available: busySlots.length === 0 && errors.length === 0,
      busySlots: busySlots.map((s: any) => ({ start: s.start, end: s.end })),
    };
  }
  return result;
}
