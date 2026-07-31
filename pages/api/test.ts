import type { NextApiRequest, NextApiResponse } from 'next';
import { userInfo } from 'os';
import DBConnect from '../../../src/server/dbConfigs';
import { Test } from '../../../src/server/models';
import { ITest } from '../../../src/server/domain/ITest';
import { IError } from '../../../src/server/domain/IError';

// Initialize database connection
DBConnect();

type Data = {
  username?: string;
  _id?: string;
  text?: string;
  message?: string;
  status?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ITest | IError>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { username }: { username: string } = userInfo();
        if (!username) {
          const error: IError = {
            status: 500,
            message: "Something bad happened!"
          };
          return res.status(error.status).json(error);
        }
        return res.status(200).json({ username });
      } catch (error) {
        console.error('GET error:', error);
        return res.status(500).json({ 
          status: 500, 
          message: "Failed to get user info" 
        });
      }

    case 'POST':
      try {
        const { text }: { text: string } = req.body;
        const TextDoc: ITest = new Test({ text });
        const savedText: ITest = await TextDoc.save();
        return res.status(201).json(savedText);
      } catch (e) {
        console.error('POST error:', e);
        const error: IError = {
          status: 500,
          message: "An error happened!"
        };
        return res.status(error.status).json(error);
      }

    case 'PUT':
      try {
        const { id, text }: { id: string; text: string } = req.body;
        const result = await Test.updateOne({ _id: id }, { text });
        if (result.modifiedCount === 0) {
          return res.status(404).json({
            status: 404,
            message: "Resource not found or not modified"
          });
        }
        return res.status(200).json({ _id: id, text });
      } catch (err) {
        console.error('PUT error:', err);
        const error: IError = {
          status: 500,
          message: "It can't be updated at this moment!"
        };
        return res.status(error.status).json(error);
      }

    case 'DELETE':
      try {
        const { id }: { id: string } = req.body;
        const result = await Test.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
          return res.status(404).json({
            status: 404,
            message: "Resource not found"
          });
        }
        return res.status(200).json({ _id: id, text: "deleted successfully" });
      } catch (err) {
        console.error('DELETE error:', err);
        const error: IError = {
          status: 500,
          message: "Resource can't be deleted!"
        };
        return res.status(error.status).json(error);
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ 
        status: 405, 
        message: `Method ${method} Not Allowed` 
      });
  }
}
