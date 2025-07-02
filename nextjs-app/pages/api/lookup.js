export default function handler(req, res) {
  const { phone } = req.query;
  res.status(200).json({
    phone: '+' + phone,
    provider: 'Telkomsel',
    name: 'John Doe',
    location: 'Jakarta'
  });
}
