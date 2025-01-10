import { NextApiRequest, NextApiResponse } from 'next';
import { Schedule } from '../../../models/reactDataSchema';
import connectMongo from '../../../app/lib/connect';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    console.log('🔥 Schedule API called');
  
    const { userId, orgPermissions } = getAuth(req);
    const canManage = orgPermissions?.includes('org:database:allow') ?? false;
  
    console.log('👤 User ID:', userId, 'Can Manage:', canManage);
  
    if (!userId) {
      console.log('❌ Unauthorized - No user ID');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    if (req.method !== 'GET') {
      console.log('❌ Method not allowed:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      console.log('📡 Connecting to MongoDB...');
      await connectMongo();
      console.log('✅ Connected to MongoDB');
  
      // If user can't manage, only show their schedules
      const query = canManage ? {} : { assignedTechnicians: userId };
  
      const scheduledJobs = (await Schedule.find(
        query
      ).lean());
      console.log('📊 Found raw schedules:', scheduledJobs.length);
  
      const transformedSchedules = scheduledJobs.map((job) => ({
        _id: job._id.toString(),
        invoiceRef: job.invoiceRef.toString(),
        jobTitle: job.jobTitle || '',
        location: job.location,
        assignedTechnicians: job.assignedTechnicians,
        startDateTime: job.startDateTime, // Send raw UTC date
        confirmed: job.confirmed,
        hours: job.hours,
        shifts: job.shifts || [],
        payrollPeriod: job.payrollPeriod ? job.payrollPeriod.toString() : '',
        deadRun: job.deadRun,
      }));
  
  
      console.log('✨ Transformed schedules:', transformedSchedules.length);
  
      const sortedSchedules = transformedSchedules.sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  
      res.status(200).json(sortedSchedules);
    } catch (error) {
      console.error('💥 Error in schedules API:', error);
      res.status(500).json({ error: 'Error fetching schedules' });
    }
  }
  