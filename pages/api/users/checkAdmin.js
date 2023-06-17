import connectMongo from '../../../lib/connect';
import { User } from '../../../models/reactDataSchema';

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */

export default async function Login(req, res) {
  console.log('CONNECTING TO MONGO');

  await connectMongo();

  console.log('CONNECTED TO MONGO');

  try {
    const adminUser = await User.collection.findOne({
      isAdmin: true,
      username: req.body.username,
      password: req.body.password,
    });

    if (adminUser) {
      // Authentication successful
      return res.status(200).json({ isAdmin: true });
    } else {
      // Authentication failed
      return res
        .status(401)
        .json({ isAdmin: false, error: 'User is not an admin.' });
    }
  } catch (error) {
    // Handle any error that occurs during the query or authentication process
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
