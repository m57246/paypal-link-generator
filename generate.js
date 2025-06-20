export default async function handler(req, res) {
  const { account_id } = req.query;

  if (!account_id) {
    return res.status(400).json({ success: false, message: "Missing account_id" });
  }

  // Simulated PayPal link
  const paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=FB-${account_id}`;

  res.status(200).json({ success: true, paypal_url: paypalUrl });
}
