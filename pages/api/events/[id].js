import connectMongo from '../../../app/lib/connect';
import { Event } from '../../../models/reactDataSchema';

export default async function handler(req, res) {
  const id = req.query.id;

  try {
    const data = await Event.findByIdAndRemove(id);
    if (!data) {
      res.status(404).send({
        message: `Cannot delete Event with id=${id}`,
      });
    } else {
      res.send({
        message: 'Event was deleted successfully!',
      });
    }
  } catch (err) {
    res.status(500).send({
      message: 'Could not find Event with id=' + id,
    });
  }
}
