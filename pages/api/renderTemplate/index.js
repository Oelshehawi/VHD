import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const templateId = 'c1377b234b5d6954'; 
      const url = `https://rest-us.apitemplate.io/v2/create-pdf?template_id=${templateId}`;

      const headers = {
        "X-API-KEY": process.env.TEMPLATEIO_KEY, 
        "Content-Type": "application/json", 
      };


      const response = await axios.post(url, req.body, { headers, responseType: 'arraybuffer' });

      if (response.status === 200) {
        // Set headers and send the PDF buffer as response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
        res.send(Buffer.from(response.data, 'binary'));
      } else {
        res.status(response.status).json({ message: 'PDF generation failed' });
      }
    } catch (error) {
      console.error('Error calling APITemplate.io:', error);
      res.status(error.response?.status || 500).json({ message: 'Failed to generate PDF', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}