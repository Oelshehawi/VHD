import connectMongo from '../../../lib/connect';
import { User } from '../../../models/reactDataSchema';

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */

export default async function Login(req, res) {
  await connectMongo();

  try {
    const adminUser = await User.collection.findOne({
      isAdmin: true,
      username: req.body.username,
      password: req.body.password,
    });

    if (adminUser) {
      return res.status(200).json(req.body);
    } else {
      return res
        .status(401)
        .json({ isAdmin: false, error: 'User is not an admin.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
