import { useParams } from '@tanstack/react-router';
import { TagDetailsRoute } from '../../routes/routes';

export function TagDetails() {
  const { tagName } = useParams({ from: TagDetailsRoute.fullPath });

  console.log('tag Details: ', tagName);

  return <div>Tag Details for: {tagName}</div>;
}
