import connectMongo from '../../../app/lib/connect';
import { Client } from '../../../models/reactDataSchema';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    // Request with ID
    const id = req.query.id;

    try {
      const data = await Client.findById(id);
      res.send(data);
    } catch (err) {
      res.status(500).send({
        message:
          err.message || 'Some error occurred while retrieving the Client.',
      });
    }
  } else if (req.method === 'DELETE') {
    const id = req.query.id;

    try {
      const data = await Client.findByIdAndRemove(id);
      if (!data) {
        res.status(404).send({
          message: `Cannot delete Client with id=${id}. Maybe Client was not found!`,
        });
      } else {
        res.send({
          message: 'Client was deleted successfully!',
        });
      }
    } catch (err) {
      res.status(500).send({
        message: 'Could not delete Client with id=' + id,
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
      const data = await Client.findByIdAndUpdate(id, req.body, {
        useFindAndModify: false,
      });
      if (!data) {
        res.status(404).send({
          message: `Cannot update Client with id=${id}. Maybe Client was not found!`,
        });
      } else {
        res.send({ message: 'Client was updated successfully.' });
      }
    } catch (err) {
      res.status(500).send({
        message: 'Error updating Client with id=' + id,
      });
    }
  }
}
