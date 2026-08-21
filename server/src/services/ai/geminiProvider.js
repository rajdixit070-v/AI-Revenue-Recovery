'use strict';

/**
 * Google Gemini Model Provider Integration (Backend REST API)
 */

const https = require('https');

async function generateContent(systemPrompt, userPrompt, timeoutMs = 8000) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const bodyData = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData),
      },
    };

    const req = https.request(options, (res) => {
      let responseText = '';
      res.on('data', chunk => responseText += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Gemini API returned HTTP status ${res.statusCode}`));
        }
        try {
          const resJson = JSON.parse(responseText);
          const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!candidateText) {
            return reject(new Error('Gemini response missing candidate text content'));
          }
          resolve(candidateText);
        } catch (err) {
          reject(new Error(`Failed to parse Gemini response payload: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Gemini request network error: ${err.message}`));
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Gemini API request timed out after ${timeoutMs}ms`));
    });

    req.write(bodyData);
    req.end();
  });
}

module.exports = { generateContent };
