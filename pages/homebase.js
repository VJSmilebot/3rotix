import { useAuthedPrismaUser } from '../hooks/useAuthedPrismaUser';
import Homebase from '../components/Homebase';
import { useState, useEffect } from 'react';

export default function HomebasePage() {
  const { prismaUser, loading } = useAuthedPrismaUser();
  const [squads, setSquads] = useState([]);
  const [selectedSquadId, setSelectedSquadId] = useState(null);

  useEffect(() => {
    if (!prismaUser?.id) return;

    fetch(`/api/squads/my?userId=${encodeURIComponent(prismaUser.id)}`)
      .then(r => r.json())
      .then(data => setSquads(Array.isArray(data) ? data : []))
      .catch(() => setSquads([]));
  }, [prismaUser?.id]);

  useEffect(() => {
    if (squads.length > 0) setSelectedSquadId(prev => prev || squads[0].id);
  }, [squads]);

  if (loading) return <div>Loading...</div>;
  if (!prismaUser) return <div>Please log in</div>;
  if (squads.length === 0) return <div>No squads found</div>;
  if (!selectedSquadId) return <div>Loading squad...</div>;

  return (
    <Homebase
      squadId={selectedSquadId}
      currentUser={prismaUser}
      squads={squads}
      onSelectSquad={setSelectedSquadId}
    />
  );
}