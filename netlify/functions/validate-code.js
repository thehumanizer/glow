const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { code } = JSON.parse(event.body);

    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invite code is required.' }) };
    }

    const { data, error } = await supabase
      .from('invite_codes')
      .select('id, is_used')
      .eq('code', code)
      .single();

    if (error || !data) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Invite code not found.' }) };
    }

    if (data.is_used) {
      return { statusCode: 403, body: JSON.stringify({ error: 'This invite code has already been used.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Invite code is valid.' }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'An internal error occurred.' }) };
  }
};