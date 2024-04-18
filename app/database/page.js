import ClientContainer from '../../components/database/ClientContainer';
import { fetchAllClients } from '../lib/data';

const Database = async () => {
  const clientData = await fetchAllClients();

  return (
    <div className='flex items-center justify-center min-h-full'>
      <ClientContainer clientData={clientData} />
    </div>
  );
};

export default Database;
