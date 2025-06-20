
import fetch from 'node-fetch';

const CLIENT_ID = "AYCxncw90LWZYzcWnmTpPvGBvItsP1vyDJfnwSUMB1g-hcFxD8pkScTXkDiR-3svJN7QhKJmSUHOfTCb";
const CLIENT_SECRET = "EAf2aCgQTEEL0FR7HoxDoseSRFBXsa-qFB7VIbD9jYpZIQL_DsMmH_Oh5VSvlcy0njKNG2moTtbEHJ3I";

export default async function handler(req, res) {
  const { account_id } = req.query;
  if (!account_id) {
    return res.status(400).json({ success: false, message: "Missing account_id" });
  }

  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ success: false, message: "Failed to get PayPal token", error: tokenData });
    }

    const accessToken = tokenData.access_token;

    const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: "1.00"
          },
          custom_id: account_id
        }],
        application_context: {
          return_url: "https://your-vercel-project.vercel.app/success",
          cancel_url: "https://your-vercel-project.vercel.app/cancel"
        }
      })
    });

    const orderData = await orderRes.json();
    const approvalLink = orderData.links?.find(link => link.rel === "approve")?.href;
    if (!approvalLink) {
      return res.status(500).json({ success: false, message: "Failed to create PayPal order", data: orderData });
    }

    res.status(200).json({ success: true, paypal_url: approvalLink });

  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
}
