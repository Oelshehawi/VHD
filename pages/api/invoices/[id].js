import connectMongo from '../../../lib/connect';
import { Invoice } from '../../../models/reactDataSchema';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    // Request with ID
    const id = req.query.id;

    try {
      const data = await Invoice.findById(id);
      res.send(data);
    } catch (err) {
      res.status(500).send({
        message:
          err.message || 'Some error occurred while retrieving the Invoice.',
      });
    }
  } else if (req.method === 'DELETE') {
    const id = req.query.id;

    try {
      const data = await Invoice.findByIdAndRemove(id);
      if (!data) {
        res.status(404).send({
          message: `Cannot delete Invoice with id=${id}. Maybe Invoice was not found!`,
        });
      } else {
        res.send({
          message: 'Invoice was deleted successfully!',
        });
      }
    } catch (err) {
      res.status(500).send({
        message: 'Could not delete Invoice with id=' + id,
      });
    }
  } else if (req.method === 'PUT') {
    const id = req.query.id;

    if (!req.body) {
      return res.status(400).send({
        message: 'Data to update cannot be empty!',
      });
    }
    try {
      const data = await Invoice.findByIdAndUpdate(id, req.body, {
        useFindAndModify: false,
      });

      if (!data) {
        res.status(404).send({
          message: `Cannot update Invoice with id=${id}. Maybe Invoice was not found!`,
        });
      } else {
        res.send({ message: 'Invoice was updated successfully.' });
      }
    } catch (err) {
      res.status(500).send({
        message: 'Error updating Invoice with id=' + id,
      });
    }
  }
}
