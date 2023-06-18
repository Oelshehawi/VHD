import connectMongo from '../../../lib/connect';
import { Event } from '../../../models/reactDataSchema';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const jobTitle = req.query.jobTitle;
    const condition = jobTitle
      ? { jobTitle: { $regex: new RegExp(jobTitle), $options: 'i' } }
      : {};

    try {
      const data = await Event.find(condition);
      res.send(data);
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving Events.',
      });
    }
  } else if (req.method === 'POST') {
    const JobTitle = req.body.jobTitle;
    const Location = req.body.location;
    const Number = req.body.number;
    const Time = req.body.time;

    const eventData = new Event({
      jobTitle: JobTitle,
      location: Location,
      number: Number,
      time: Time,
    });

    try {
      await eventData.save();
      res.send('Inserted data.');
    } catch (err) {
      console.log(err);
      res.status(500).send('Error inserting data.');
    }
  }
}
